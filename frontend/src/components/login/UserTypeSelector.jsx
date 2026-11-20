
"use client";

import { UserRound, UsersRound } from "lucide-react";

export default function UserTypeSelector({ value, onChange }) {
  const options = [
    {
      id: "employee",
      title: "موظف",
      icon: UserRound,
    },
    {
      id: "hr",
      title: "الموارد البشرية",
      icon: UsersRound,
    },
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
            className={`
              group flex min-h-[72px] w-full
              flex-col items-center justify-center gap-2
              rounded-xl border p-2
              cursor-pointer
              transition-all duration-300 ease-out
              hover:-translate-y-1 hover:shadow-md
              active:translate-y-0 active:scale-[0.98]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#1D5485]
              focus-visible:ring-offset-2
              ${
                active
                  ? "border-[#1D5485] bg-[#EAF2FA] text-[#163B63] shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-[#8CAAC8] hover:bg-slate-50"
              }
            `}
          >
            <Icon
              size={21}
              className="
                transition-transform duration-300
                group-hover:scale-110
              "
            />

            <span className="text-xs font-semibold sm:text-sm">
              {option.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
