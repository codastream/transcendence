import { logger } from "src";
import { appenv } from "src/config";
import { RedisManager } from "src/data/um.redis.client";
import { API_ERRORS, REDIS } from "src/utils/messages";

export async function initUserSubscribers(){
    const redis = RedisManager.getInstance();

    await redis.sub.subscribe(appenv.UM_REDIS_CHANNEL);
    redis.sub.on('message', async (channel, message) => {
        if (channel !== appenv.UM_REDIS_CHANNEL)
            return;
        const msg = JSON.parse(message);

        try {
            switch (msg.action) {
                case REDIS.MATCH_FINISHED:
                    // TODO update history, ranking
                    break;
            }
        } catch (error) {
            logger.error({event: API_ERRORS.REDIS.PROCESS, error});
        }
    })
}