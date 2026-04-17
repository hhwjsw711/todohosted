import React from "react";
import { useNavigate } from "react-router-dom";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-[12rem] font-bold leading-none tracking-tighter animate-glow">404</h1>

        <div className="space-y-4">
          <h2 className="text-4xl font-light">页面未找到</h2>
          <p className="text-zinc-400 text-lg">
            您查找的页面不存在或已被移动。
          </p>
        </div>

        <div className="pt-8">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors text-sm font-medium">
            返回首页
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 text-center text-zinc-500 text-sm">
        <p>用 ❤️ 为丽水市数据局打造。</p>
      </div>
    </div>
  );
};

export default NotFound;
