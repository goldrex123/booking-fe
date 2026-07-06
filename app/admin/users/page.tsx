"use client";

import { useState } from "react";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/use-admin-users";
import type { AdminUser, UserRole } from "@/types/user";

type RoleChangeIntent = {
  user: AdminUser;
  nextRole: UserRole;
};

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return (
      <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
        <ShieldCheck className="size-3" />
        관리자
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <ShieldOff className="size-3" />
      일반 사용자
    </Badge>
  );
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [intent, setIntent] = useState<RoleChangeIntent | null>(null);

  const handleRoleSelect = (user: AdminUser, nextRole: UserRole) => {
    if (nextRole === user.role) return;
    setIntent({ user, nextRole });
  };

  const handleConfirm = async () => {
    if (!intent) return;
    try {
      await updateRole.mutateAsync({ id: intent.user.id, role: intent.nextRole });
      toast.success(
        `${intent.user.name}님의 역할이 ${intent.nextRole === "ADMIN" ? "관리자" : "일반 사용자"}로 변경되었습니다`
      );
    } catch {
      toast.error("역할 변경에 실패했습니다");
    } finally {
      setIntent(null);
    }
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "이름",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {u.name[0]}
          </div>
          <span className="text-sm font-medium">{u.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "이메일",
      headerClassName: "hidden sm:table-cell",
      cellClassName: "hidden text-sm text-muted-foreground sm:table-cell",
      cell: (u) => u.email,
    },
    {
      key: "department",
      header: "부서",
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden text-sm text-muted-foreground md:table-cell",
      cell: (u) => u.department,
    },
    {
      key: "role",
      header: "현재 역할",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: "actions",
      header: "역할 변경",
      headerClassName: "text-right",
      cellClassName: "",
      cell: (u) => (
        <div className="flex justify-end">
          <Select value={u.role} onValueChange={(v) => handleRoleSelect(u, v as UserRole)}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">일반 사용자</SelectItem>
              <SelectItem value="ADMIN">관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Users className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">사용자 관리</h1>
          <p className="text-sm text-muted-foreground">
            사용자 목록을 조회하고 역할을 관리합니다
          </p>
        </div>
        {!isLoading && (
          <span className="ml-auto text-sm text-muted-foreground">
            총 {users.length}명
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyTitle="등록된 사용자가 없습니다"
        emptyIcon={<Users className="size-8" />}
        getRowKey={(u) => u.id}
      />

      <ConfirmDialog
        open={!!intent}
        onOpenChange={(open) => !open && setIntent(null)}
        title="역할 변경 확인"
        description={
          <>
            <span className="font-medium">{intent?.user.name}</span>님의 역할을{" "}
            <span className="font-medium">
              {intent?.nextRole === "ADMIN" ? "관리자" : "일반 사용자"}
            </span>
            로 변경하시겠습니까?
          </>
        }
        confirmLabel="변경"
        onConfirm={handleConfirm}
        isPending={updateRole.isPending}
      />
    </div>
  );
}
