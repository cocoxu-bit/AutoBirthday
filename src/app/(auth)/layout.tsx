export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-festive flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating emojis */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[10%] left-[10%] text-4xl animate-float opacity-20">
          🎂
        </span>
        <span
          className="absolute top-[20%] right-[15%] text-3xl animate-float opacity-15"
          style={{ animationDelay: "1s" }}
        >
          🎉
        </span>
        <span
          className="absolute bottom-[25%] left-[20%] text-5xl animate-float opacity-10"
          style={{ animationDelay: "2s" }}
        >
          🎈
        </span>
        <span
          className="absolute top-[60%] right-[10%] text-3xl animate-float opacity-15"
          style={{ animationDelay: "3s" }}
        >
          🎁
        </span>
        <span
          className="absolute bottom-[10%] right-[30%] text-4xl animate-float opacity-10"
          style={{ animationDelay: "4s" }}
        >
          🥳
        </span>
        <span
          className="absolute top-[40%] left-[5%] text-3xl animate-float opacity-10"
          style={{ animationDelay: "1.5s" }}
        >
          ✨
        </span>
      </div>

      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  );
}
