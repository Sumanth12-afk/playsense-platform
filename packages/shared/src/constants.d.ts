export declare const KNOWN_GAMES: ({
    name: string;
    process: string;
    category: "competitive";
} | {
    name: string;
    process: string;
    category: "creative";
} | {
    name: string;
    process: string;
    category: "casual";
} | {
    name: string;
    process: string;
    category: "social";
})[];
export declare const LATE_NIGHT_HOUR = 22;
export declare const SYNC_INTERVAL_MS = 60000;
export declare const HEALTH_SCORE_THRESHOLDS: {
    session_length: {
        good_max: number;
        watch_max: number;
    };
    break_frequency: {
        good_min: number;
        watch_min: number;
    };
    late_night: {
        minimal_max: number;
        moderate_max: number;
    };
    game_variety: {
        good_min: number;
        low_min: number;
    };
    dominance: {
        watch_threshold: number;
        alert_threshold: number;
    };
};
export declare const AGE_RANGES: string[];
export declare const CONVERSATION_STARTERS: ({
    context: "starting";
    try_saying: string;
    avoid_saying: string;
} | {
    context: "time_limits";
    try_saying: string;
    avoid_saying: string;
} | {
    context: "late_night";
    try_saying: string;
    avoid_saying: string;
} | {
    context: "one_game_focus";
    try_saying: string;
    avoid_saying: string;
})[];
export declare const PRIVACY_PROMISE: {
    title: string;
    subtitle: string;
    never: string[];
};
//# sourceMappingURL=constants.d.ts.map