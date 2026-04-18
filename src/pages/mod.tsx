import React, { useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import NotFound from "./NotFound";
import { Menu, Sun, Moon, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const AdminDashboard = () => {
  // 用户和认证钩子
  const { user } = useUser();

  // 状态钩子
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<
    Record<string, "messages" | "todos" | "notes" | "docs">
  >({});
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminDarkMode");
      return saved ? JSON.parse(saved) : window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 查询钩子
  const pages = useQuery(api.pages.getPages) ?? [];
  const defaultPage = useQuery(api.pages.getPageBySlug, { slug: "default" });
  const messages = defaultPage
    ? (useQuery(api.pageMessages.getMessages, { pageId: defaultPage._id }) ?? [])
    : [];
  const todos = defaultPage ? (useQuery(api.todos.get, { pageId: defaultPage._id }) ?? []) : [];
  const pageMessages = useQuery(api.pageMessages.getAllMessages) ?? [];
  const pageTodos = useQuery(api.todos.getAll) ?? [];
  const pageNotes = useQuery(api.pageNotes.getAllNotes) ?? [];

  // 变更钩子
  const createPage = useMutation(api.pages.createPage);
  const deletePage = useMutation(api.pages.deletePage);
  const togglePageStatus = useMutation(api.pages.togglePageStatus);
  const deleteAllMessages = useMutation(api.pageMessages.deleteAllMessages);
  const deleteAllTodos = useMutation(api.todos.deleteAllTodos);
  const deleteAllNotes = useMutation(api.pageNotes.deleteAllNotes);
  const deleteAllPageDocs = useMutation(api.docs.deleteAllPageDocs);
  const deleteMessage = useMutation(api.pageMessages.deleteMessage);
  const deleteTodo = useMutation(api.todos.remove);
  const deleteNote = useMutation(api.pageNotes.deleteNote);
  const deleteDoc = useMutation(api.docs.deleteDoc);
  const sendPageMessage = useMutation(api.pageMessages.send);
  const toggleLike = useMutation(api.pageMessages.toggleLike);
  const getMessagesForCsv = useMutation(api.pageMessages.getMessagesForCsv);

  // 效果钩子
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminDarkMode", JSON.stringify(isDark));
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDark]);

  // 如果没有用户或不是管理员，显示404
  if (!user || user.publicMetadata?.role !== "admin") return <NotFound />;

  const bgClasses = isDark ? "bg-zinc-900" : "bg-[#F5F5F4]";
  const cardClasses = isDark ? "bg-zinc-800" : "bg-white";
  const textClasses = isDark ? "text-zinc-100" : "text-zinc-900";
  const mutedTextClasses = isDark ? "text-zinc-400" : "text-zinc-600";

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageSlug.trim() || !newPageTitle.trim()) return;

    try {
      const pageId = await createPage({
        slug: newPageSlug.trim(),
        title: newPageTitle.trim(),
      });

      if (pageId) {
        setNewPageSlug("");
        setNewPageTitle("");
        await sendPageMessage({
          pageId,
          text: `欢迎来到 ${newPageTitle.trim()}!`,
          sender: "系统",
        });
        await sendPageMessage({
          pageId,
          text: '开始聊天，输入 @ai 询问AI，输入 remind me 设置提醒，或输入 note: 创建笔记。',
          sender: "系统",
        });
        window.location.href = `/${newPageSlug.trim()}`;
      }
    } catch (error) {
      console.error("Failed to create page:", error);
      alert("创建页面失败。该URL可能已被使用。");
    }
  };

  const handleDownloadCsv = async (page: { _id: Id<"pages">; slug: string }) => {
    const pageMessages = await getMessagesForCsv({ pageId: page._id });
    if (!pageMessages) return;

    const csvContent = [
      ["时间", "发送者", "消息", "点赞数"].join(","),
      ...pageMessages.map((msg) =>
        [
          new Date(msg.timestamp).toLocaleString(),
          msg.sender,
          `"${msg.text.replace(/"/g, '""')}"`,
          msg.likes ?? 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.slug}-chat-messages.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgClasses} ${textClasses}`}>
      {/* Header */}
      <header className={`relative w-full py-6 px-4 ${cardClasses}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center font-['Inter']">
          <h1 className="text-xl font-normal flex flex-col md:flex-row items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <img
                src={isDark ? "/convex-logo-white.svg" : "/convex-logo-black.svg"}
                alt="Convex Logo"
                className="h-4"
              />
            </a>
            <a href="/" className="text-sm md:text-xl">
              AI聊天与待办同步应用
            </a>
          </h1>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`${mutedTextClasses} hover:opacity-80 transition-opacity`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 font-sans flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-normal">管理后台</h1>
            {/* <div className="text-sm text-gray-600">{user?.emailAddresses[0]?.emailAddress}</div> */}
          </div>

          {/* Create New Page Section */}
          <section className={`mb-8 ${cardClasses} p-6 rounded-lg shadow`}>
            <h2 className="text-xl font-semibold mb-4">创建新页面</h2>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${mutedTextClasses} mb-1`}>
                  页面URL
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="例如: team-chat"
                  className={`w-full p-2 border rounded ${isDark ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-200"} ${textClasses}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${mutedTextClasses} mb-1`}>
                  页面标题
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="例如: 团队聊天"
                  className={`w-full p-2 border rounded ${isDark ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-200"} ${textClasses}`}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                创建页面
              </button>
            </form>
          </section>

          {/* Manage Pages Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">管理页面</h2>
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page._id}
                  className={`p-4 border rounded-lg ${cardClasses} ${isDark ? "border-zinc-700" : "border-zinc-200"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{page.title}</h3>
                      <p className={mutedTextClasses}>/{page.slug}</p>
                      <p className="text-xs text-gray-400">
                        创建时间: {new Date(page.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                          查看
                        </a>
                        <button
                          onClick={() => togglePageStatus({ id: page._id })}
                          className={`px-3 py-1 rounded ${page.isActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white`}>
                          {page.isActive ? "禁用" : "启用"}
                        </button>
                        <button
                          onClick={() => handleDownloadCsv(page)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                          下载聊天记录CSV
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (window.confirm("删除此页面的所有聊天消息?")) {
                              await deleteAllMessages({ pageId: page._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                          清空聊天
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("删除此页面的所有待办?")) {
                              await deleteAllTodos({ pageId: page._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                          清空待办
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("删除此页面的所有笔记?")) {
                              await deleteAllNotes({ pageId: page._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                          清空笔记
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("删除此页面的所有文档?")) {
                              await deleteAllPageDocs({ pageId: page._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                          清空文档
                        </button>
                        {page.slug !== "default" && (
                          <button
                            onClick={() => {
                              if (window.confirm("删除此页面及其所有数据?")) {
                                deletePage({ id: page._id });
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setExpandedPages((prev) => ({
                          ...prev,
                          [page._id]: !prev[page._id],
                        }));
                        if (!activeTab[page._id]) {
                          setActiveTab((prev) => ({
                            ...prev,
                            [page._id]: "messages",
                          }));
                        }
                      }}
                      className={`${textClasses} text-sm hover:underline`}>
                      {expandedPages[page._id] ? "隐藏内容" : "显示内容"}
                    </button>
                  </div>

                  {expandedPages[page._id] && (
                    <div className="mt-4">
                      <div className="flex gap-4 mb-4">
                        <button
                          onClick={() =>
                            setActiveTab((prev) => ({ ...prev, [page._id]: "messages" }))
                          }
                          className={`px-3 py-1 rounded ${activeTab[page._id] === "messages" ? "bg-blue-500 text-white" : `${mutedTextClasses} hover:bg-zinc-100 dark:hover:bg-zinc-700`}`}>
                          消息
                        </button>
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [page._id]: "todos" }))}
                          className={`px-3 py-1 rounded ${activeTab[page._id] === "todos" ? "bg-blue-500 text-white" : `${mutedTextClasses} hover:bg-zinc-100 dark:hover:bg-zinc-700`}`}>
                          待办
                        </button>
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [page._id]: "notes" }))}
                          className={`px-3 py-1 rounded ${activeTab[page._id] === "notes" ? "bg-blue-500 text-white" : `${mutedTextClasses} hover:bg-zinc-100 dark:hover:bg-zinc-700`}`}>
                          笔记
                        </button>
                        <button
                          onClick={() => setActiveTab((prev) => ({ ...prev, [page._id]: "docs" }))}
                          className={`px-3 py-1 rounded ${activeTab[page._id] === "docs" ? "bg-blue-500 text-white" : `${mutedTextClasses} hover:bg-zinc-100 dark:hover:bg-zinc-700`}`}>
                          文档
                        </button>
                      </div>

                      <div className="space-y-2">
                        {activeTab[page._id] === "messages" &&
                          pageMessages
                            .filter((msg) => msg.pageId === page._id)
                            .map((message) => (
                              <div
                                key={message._id}
                                className={`p-2 border rounded flex justify-between items-center ${isDark ? "border-zinc-700" : "border-zinc-200"}`}>
                                <div>
                                  <p>
                                    <strong>{message.sender}</strong>: {message.text}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(message.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (window.confirm("删除此消息?")) {
                                      await deleteMessage({ id: message._id });
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                                  删除
                                </button>
                              </div>
                            ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
