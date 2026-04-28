import React from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  // After login, check if user is admin and redirect accordingly
  React.useEffect(() => {
    if (user) {
      if (user.publicMetadata?.role === "admin") navigate("/mod");
      else navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative w-full py-6 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-['Inter']">
          <h1 className="text-xl font-normal flex flex-col md:flex-row items-center gap-2">
            <a href="/" className="text-sm md:text-xl">
              AI聊天与待办同步应用
            </a>
          </h1>
        </div>
      </header>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">管理员登录</h2>
          <SignIn redirectUrl="/mod" />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative w-full py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm mb-2">
            所有聊天和待办每天通过定时任务自动清理。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPage;
