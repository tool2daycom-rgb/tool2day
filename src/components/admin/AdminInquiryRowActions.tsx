"use client";

import Link from "next/link";
import {
  archiveInquiryAction,
  deleteInquiryAction,
  unarchiveInquiryAction,
} from "@/app/admin/actions";
import { adminAr } from "@/content/admin-ar";
import type { InquiryStatus } from "@/db/schema";

type Props = {
  id: string;
  status: InquiryStatus;
  listHref: string;
  showOpen?: boolean;
  showUnarchive?: boolean;
};

export function AdminInquiryRowActions({
  id,
  status,
  listHref,
  showOpen = true,
  showUnarchive = false,
}: Props) {
  return (
    <div className="admin-row-actions">
      {showOpen ? (
        <Link className="btn btn-ghost" href={`/admin/${id}`}>
          {adminAr.open}
        </Link>
      ) : null}
      {status === "archived" ? (
        showUnarchive ? (
          <form action={unarchiveInquiryAction}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="btn btn-ghost">
              {adminAr.unarchive}
            </button>
          </form>
        ) : null
      ) : (
        <form action={archiveInquiryAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="next" value={listHref} />
          <button type="submit" className="btn btn-ghost admin-btn-archive">
            {adminAr.archive}
          </button>
        </form>
      )}
      <form
        action={deleteInquiryAction}
        onSubmit={(event) => {
          if (!window.confirm(adminAr.deleteConfirm)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="btn btn-ghost admin-btn-delete">
          {adminAr.delete}
        </button>
      </form>
    </div>
  );
}
