import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ApiBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: string;
  currentPage: number;
  totalPages: number;
  addedBy: string;
};

export function LibraryWidget() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ApiBook[]>([]);

  useEffect(() => {
    apiFetch<ApiBook[]>("/library")
      .then(data => setBooks(data))
      .catch(err => console.error("LibraryWidget error:", err));
  }, []);

  const currentlyReading = books.filter(b => b.status === "reading");
  if (currentlyReading.length === 0) return null;

  const book = currentlyReading[0];

  return (
    <Link href="/library">
      <div className="mx-4 mt-8 mb-4 bg-gradient-to-br from-gray-900 to-black rounded-3xl p-4 shadow-xl border border-white/10 cursor-pointer active:scale-95 transition-transform overflow-hidden relative group">
        <div className="absolute inset-0 z-0">
           <img 
              src={book.coverUrl || ""} 
              className="w-full h-full object-cover opacity-20 blur-xl scale-150" 
              alt="" 
            />
        </div>
        <div className="relative z-10 flex gap-4 items-center">
          <div className="w-16 h-24 shrink-0 rounded-md overflow-hidden shadow-lg border border-white/20">
            <img src={book.coverUrl || ""} className="w-full h-full object-cover" alt={book.title} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Currently Reading</span>
            </div>
            <h3 className="text-white font-serif font-bold text-lg leading-tight truncate">{book.title}</h3>
            <p className="text-gray-400 text-xs truncate mb-2">{book.author}</p>
            
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-1">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Page {book.currentPage} of {book.totalPages}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
