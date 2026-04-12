"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const STOCKS = [
    { symbol: "NVDA", name: "Nvidia Corp", price: 894.20, change: "+4.2%", isHigh: true },
    { symbol: "AAPL", name: "Apple Inc.", price: 173.50, change: "+1.2%", isHigh: true },
    { symbol: "TSLA", name: "Tesla Inc.", price: 172.98, change: "-3.4%", isHigh: false },
    { symbol: "MSFT", name: "Microsoft", price: 415.10, change: "+0.8%", isHigh: true },
    { symbol: "META", name: "Meta Platforms", price: 485.50, change: "-1.1%", isHigh: false },
];

export const LiveStocksWidget = memo(function LiveStocksWidget() {
    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Live Stocks
            </h2>
            <div className="space-y-4">
                {STOCKS.map(stock => (
                    <div key={stock.symbol} className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner ${stock.isHigh ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                {stock.symbol[0]}
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm group-hover:text-primary transition-colors">{stock.symbol}</div>
                                <div className="text-zinc-500 text-xs">{stock.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white font-mono text-sm">₹{stock.price.toFixed(2)}</div>
                            <div className={`text-xs font-bold flex items-center justify-end gap-1 ${stock.isHigh ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.isHigh ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stock.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
