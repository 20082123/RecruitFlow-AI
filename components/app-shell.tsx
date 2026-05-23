import Link from "next/link";
import {
  BarChart3,
  Bot,
  FileInput,
  LayoutDashboard,
  UsersRound
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "招聘看板",
    icon: LayoutDashboard
  },
  {
    href: "/candidates",
    label: "候选人",
    icon: UsersRound
  },
  {
    href: "/import",
    label: "群聊导入",
    icon: FileInput
  }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white/88 px-4 py-5 shadow-panel backdrop-blur md:block">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold text-ink">
              RecruitFlow AI
            </span>
            <span className="block text-xs text-slate-500">招聘记录助手</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-ocean/15 bg-ocean/8 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ocean">
            <BarChart3 className="h-4 w-4" />
            Mock 模式就绪
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            当前版本使用本地 JSON 数据，后续接入 AI 解析接口。
          </p>
        </div>
      </aside>

      <main className="md:pl-64">
        <div className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/80 bg-white/78 px-5 py-4 shadow-panel backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">
                Recruiting Operations
              </p>
              <h1 className="mt-1 text-xl font-semibold text-ink">
                企业微信招聘数据自动记录 Demo
              </h1>
            </div>
            <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:block">
              本地可运行
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
