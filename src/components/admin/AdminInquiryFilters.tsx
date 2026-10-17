"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminAr } from "@/content/admin-ar";

type Props = {
  type: string;
  status: string;
  q: string;
  period: string;
};

function buildHref(input: {
  type: string;
  status: string;
  q: string;
  period: string;
}) {
  const params = new URLSearchParams();
  if (input.type && input.type !== "all") params.set("type", input.type);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.period === "week") params.set("period", "week");
  if (input.q.trim()) params.set("q", input.q.trim());
  const query = params.toString();
  return query ? `/admin/inquiries?${query}` : "/admin/inquiries";
}

export function AdminInquiryFilters({ type, status, q, period }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  function go(next: { type: string; status: string; q: string; period: string }) {
    startTransition(() => {
      router.push(buildHref(next));
      router.refresh();
    });
  }

  return (
    <form
      className="admin-filters"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        go({ type, status, q: query, period });
      }}
    >
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={adminAr.search}
        aria-label={adminAr.search}
      />
      <select
        name="type"
        value={type}
        aria-label={adminAr.allTypes}
        disabled={pending}
        onChange={(event) =>
          go({ type: event.target.value, status, q: query, period })
        }
      >
        <option value="all">{adminAr.allTypes}</option>
        <option value="contact">{adminAr.typeContact}</option>
        <option value="project">{adminAr.typeProject}</option>
      </select>
      <select
        name="status"
        value={status}
        aria-label={adminAr.allStatuses}
        disabled={pending}
        onChange={(event) =>
          go({ type, status: event.target.value, q: query, period })
        }
      >
        <option value="all">{adminAr.allStatuses}</option>
        <option value="new">{adminAr.statusNew}</option>
        <option value="in_progress">{adminAr.statusInProgress}</option>
        <option value="replied">{adminAr.statusReplied}</option>
        <option value="archived">{adminAr.statusArchived}</option>
      </select>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {adminAr.searchBtn}
      </button>
    </form>
  );
}
