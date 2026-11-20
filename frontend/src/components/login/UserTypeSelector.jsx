
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
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex min-h-[82px] w-full flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${
              active
                ? "border-[#1D5485] bg-[#EAF2FA] text-[#163B63] shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-[#8CAAC8] hover:bg-slate-50"
            }`}
          >
            <Icon size={23} />
            <span className="text-sm font-semibold">
              {option.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
