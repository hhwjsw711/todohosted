import React, { useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Menu, Sun, Moon, X } from "lucide-react";

const AboutPage = () => {
  const { user } = useUser();
  const [isDark, setIsDark] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFloatingBox, setShowFloatingBox] = useState(false);

  const iconClasses = isDark ? "text-zinc-400" : "text-zinc-600";
  const cardClasses = isDark ? "bg-zinc-900" : "bg-white border border-zinc-200 shadow-sm";

  return (
    <div className={`min-h-screen ${cardClasses} relative flex flex-col font-['Inter']`}>
      {/* Grid background with gradient */}
      <div className="relative h-full w-full">
        {isDark ? (
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        ) : (
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="relative w-full py-6 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-['Inter']">
          {/* Mobile Menu Button */}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden">
            <Menu className={`w-6 h-6 ${iconClasses}`} />
          </button>

          {/* Logo and Title */}
          <h1
            className={`${iconClasses} text-xl font-normal flex flex-col md:flex-row items-center gap-2 flex-1 justify-center md:justify-start`}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm md:text-xl">
              AI聊天与待办同步应用
            </a>
          </h1>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`${iconClasses} hover:opacity-80 transition-opacity`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && user.publicMetadata?.role !== "admin" && <UserButton />}
          </div>

          {/* Mobile Icons */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`${iconClasses} hover:opacity-80 transition-opacity`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && user.publicMetadata?.role !== "admin" && <UserButton />}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-4 px-4 z-50">
            <div className="flex flex-col gap-4">
              <a
                href="https://task.isllm.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconClasses} hover:opacity-80 transition-opacity`}>
                任务流
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className={`text-4xl font-normal tracking-tighter ${iconClasses} mb-4`}>
              AI聊天与待办同步应用
            </h1>
            <p className={`${iconClasses}`}>基于Convex的实时协作平台</p>
          </div>

          {/* Features Section */}
          <div className={`${cardClasses} rounded-lg p-8 mb-16`}>
            <h2 className={`text-2xl font-normal tracking-tighter ${iconClasses} mb-6`}>
              功能特点
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className={`text-lg font-medium ${iconClasses} mb-3`}>实时聊天</h3>
                <ul className={`list-disc pl-5 space-y-2 ${iconClasses}`}>
                  <li>即时发送和接收聊天消息</li>
                  <li>使用 "@ai" 命令获取AI回复</li>
                  <li>来自OpenAI的实时消息流</li>
                  <li>在聊天中输入 "remind me" 创建提醒</li>
                  <li>使用向量搜索功能搜索消息</li>
                  <li>点赞消息并查看点赞数</li>
                  <li>发送表情反应</li>
                </ul>
              </div>

              <div>
                <h3 className={`text-lg font-medium ${iconClasses} mb-3`}>待办事项</h3>
                <ul className={`list-disc pl-5 space-y-2 ${iconClasses}`}>
                  <li>创建和管理公开提醒</li>
                  <li>切换完成状态</li>
                  <li>赞成和反对提醒</li>
                  <li>所有连接客户端实时更新</li>
                  <li>悬停控制删除提醒</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className={`${cardClasses} rounded-lg p-8`}>
            <h2 className={`text-2xl font-normal tracking-tighter ${iconClasses} mb-6`}>价格</h2>

            <div className={`${isDark ? "bg-zinc-800" : "bg-zinc-50"} rounded-lg p-6`}>
              <div className="text-center">
                <h3 className={`text-xl font-medium ${iconClasses} mb-2`}>免费使用</h3>
                <p className={`text-3xl font-bold ${iconClasses} mb-4`}>¥0</p>
                <p className={`${iconClasses} mb-6`}>包含所有功能</p>
              </div>

              <ul className={`space-y-3 ${iconClasses}`}>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  无限消息
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  AI聊天助手
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  实时协作
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  向量搜索
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  待办管理
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Box */}
      {showFloatingBox && (
        <a href="https://convex.link/chatsynclinks" target="_blank" rel="noopener noreferrer">
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-lg shadow flex items-center gap-3 z-50">
            <span>技术支持</span>
            <img src="/convex-logo-white.svg" alt="Convex Logo" className="h-4" />
            <button
              onClick={() => setShowFloatingBox(false)}
              className="ml-2 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </a>
      )}

      {/* Footer */}
      <footer className="relative w-full py-6 px-4 mt-1">
        <div className="max-w-7xl mx-auto text-center">
          <p className={`${iconClasses} text-sm mb-2`}>
            所有聊天和提醒每天通过定时任务自动清理。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
