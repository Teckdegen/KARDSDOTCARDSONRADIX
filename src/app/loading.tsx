export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E27]">
      <div className="text-center fade-in">
        <img 
          src="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" 
          alt="KARDS Logo" 
          className="w-32 h-32 mx-auto mb-6 rounded-3xl object-cover"
        />
        <p className="text-white/60 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

