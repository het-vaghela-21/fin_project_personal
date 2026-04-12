"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Newspaper,
    ExternalLink,
    RefreshCw,
    Search,
    TrendingUp,
    Globe,
    Bitcoin,
    Landmark,
    Cpu,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt: string;
    source: string;
}

const CATEGORIES = [
    { label: "Top Stories", query: "finance", icon: TrendingUp },
    { label: "Markets", query: "stock market", icon: Globe },
    { label: "Crypto", query: "cryptocurrency", icon: Bitcoin },
    { label: "Economy", query: "economy", icon: Landmark },
    { label: "Fintech", query: "fintech", icon: Cpu },
];

function timeAgo(dateString: string) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-white/5 bg-black/40 overflow-hidden">
            <div className="h-44 bg-white/5" />
            <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 bg-white/5 rounded w-16" />
                    <div className="h-2.5 bg-white/5 rounded w-12" />
                </div>
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-4/5" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
        </div>
    );
}

export function FinanceNews() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const fetchNews = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/news?q=${encodeURIComponent(query)}&count=10`);
            if (!res.ok) {
                console.error("News fetch failed:", res.status);
                setArticles([]);
                return;
            }
            const data = await res.json();
            const fetchedArticles = data.articles || [];
            setArticles(fetchedArticles);
        } catch (err) {
            console.error("News fetch error:", err);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on initial load only
    useEffect(() => {
        fetchNews(CATEGORIES[0].query);
    }, [fetchNews]);

    const handleCategoryClick = (index: number) => {
        setActiveCategory(index);
        setIsSearching(false);
        setSearchQuery("");
        fetchNews(CATEGORIES[index].query);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearching(true);
            fetchNews(searchQuery.trim());
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearching(false);
        fetchNews(CATEGORIES[activeCategory].query);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-primary" />
                        </div>
                        Finance Newsletter
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Stay updated with the latest financial news and market insights.
                    </p>
                </div>
                <button
                    onClick={() =>
                        isSearching
                            ? fetchNews(searchQuery)
                            : fetchNews(CATEGORIES[activeCategory].query)
                    }
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all disabled:opacity-40"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </header>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative glass-panel rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search financial news... (e.g. RBI policy, inflation, Tesla earnings)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-white placeholder-zinc-500 pl-14 pr-20 py-4 outline-none text-sm"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                        Go
                    </button>
                </div>
            </form>

            {/* Category Tabs */}
            {!isSearching && (
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat, i) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === i;
                        return (
                            <button
                                key={cat.label}
                                onClick={() => handleCategoryClick(i)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                    isActive
                                        ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                        : "text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/5 border-white/5"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Search Active Indicator */}
            {isSearching && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                        <Search className="w-4 h-4" />
                        Results for &ldquo;{searchQuery}&rdquo;
                    </div>
                    <button
                        onClick={clearSearch}
                        className="text-zinc-400 hover:text-white text-sm underline underline-offset-4 transition-colors"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeletons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={`skeleton-${i}`} />
                            ))}
                        </motion.div>
                    ) : articles.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                <Newspaper className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-400 text-lg font-medium">No news found</p>
                            <p className="text-zinc-500 text-sm mt-1">
                                Try a different search term or category
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="articles"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            {articles.map((article, i) => (
                                <motion.a
                                    key={`${article.url}-${i}`}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.25 }}
                                    className="group rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden hover:border-primary/20 hover:shadow-[0_0_30px_rgba(249,115,22,0.05)] transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
                                        {article.image ? (
                                            <img
                                                src={article.image}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Newspaper className="w-12 h-12 text-zinc-700" />
                                            </div>
                                        )}
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        {/* Source badge */}
                                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white border border-white/10">
                                                {article.source}
                                            </span>
                                            <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[11px] text-zinc-300 border border-white/10">
                                                {timeAgo(article.publishedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="text-white font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.description && (
                                            <p className="text-zinc-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                                                {article.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-4 text-xs text-primary font-medium">
                                            Read Article
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
