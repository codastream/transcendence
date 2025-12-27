export const API_ERRORS = {
    USER: {
        NOT_FOUND: "User not found",
        INVALID_FORMAT: "Invalid format",
        ADMIN_FORBIDDEN: "Admin username is restricted",
        CREATE_FAILED: "Profile might already exist. Or an error occurred during creation",
        FRIEND: {
            ALREADY_FRIENDS: "The users are already friends",
            ADD_FAILED: "Failed to add friend",
            DELETE_FAILED: "Failed to remove friend",
            NOT_FRIENDS: "The users are not friends",
        }

    },
    DB: {
        CONNECTION_ERROR: "Database connection failed"
    },
    REDIS: {
        BASE: "Redis Error",
        PROCESS: "Error processing Redis message",
        CONNECT: "Redis failed to connect after all possible retries",
        CONNECT_RETRY: "Redis failed to connect.. Retrying",
    },
    UNKNOWN: "Unknown error"
} as const;

export const LOG_EVENTS = {
    INVALID_REQUEST: "invalid_request",
    GET_PROFILE_BY_USERNAME: "get_profile_by_username",
    CREATE_PROFILE: "create_profile",
    REDIS_CONNECT: "Redis connected",
    GET_FRIENDS: "get_friends_by_user_id",
    ADD_FRIEND: "add_friend",
    REMOVE_FRIEND: "remove_friend",
    UPDATE_FRIEND: "Friend nickname update"
}

export const REDIS = {
    MATCH_FINISHED: "match_finished"
}
