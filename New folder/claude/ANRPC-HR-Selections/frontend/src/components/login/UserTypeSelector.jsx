"use client";

import { UserRound, UsersRound } from "lucide-react";

export default function UserTypeSelector({ value, onChange }) {
  const options = [
    { id: "employee", title: "موظف", icon: UserRound },
    { id: "hr", title: "الموارد البشرية", icon: UsersRound },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={`group flex min-h-[64px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5485] focus-visible:ring-offset-2 ${active ? "border-[#1D5485] bg-[#EAF2FA] text-[#163B63] shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-[#8CAAC8] hover:bg-slate-50"}`}
          >
            <Icon size={20} className="transition-transform duration-200 group-hover:scale-105" />
            <span className="text-xs font-semibold sm:text-sm">{option.title}</span>
          </button>
        );
      })}
    </div>
  );
}
