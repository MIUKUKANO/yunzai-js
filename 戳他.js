import plugin from '../../lib/plugins/plugin.js';

// 可配置参数
const Poke = 10; // 戳的次数
const fanxiangPoke = 10; // 反击戳的次数
const pokeTime = 1000; // 戳的间隔时间（毫秒）
const whitelist = ['123456789', '987654321']; // 白名单QQ号

export default class PokePlugin extends plugin {
    constructor() {
        super({
            name: '戳一戳',
            priority: 50,
            rule: [
                {
                    reg: '^#?(戳他)$',
                    fnc: 'pokeUser'
                }
            ]
        });
    }

    async pokeUser(e) {
        const targetId = String(e.message[1].qq); // 获取目标用户的QQ号并转换为字符串
        const groupId = e.group_id; // 获取群ID
        const senderId = String(e.user_id); // 获取触发者的QQ号

        // 如果目标用户在白名单中，触发反击，将目标改为触发者
        if (whitelist.includes(targetId)) {
            // 反击戳触发者
            for (let i = 0; i < fanxiangPoke; i++) {
                await e.bot.sendApi('group_poke', {
                    group_id: groupId,
                    user_id: senderId // 反戳触发者
                });
                await this.delay(pokeTime); // 等待设定的戳间隔时间
            }
            return;
        }

        // 发送设定次数的戳一戳请求
        for (let i = 0; i < Poke; i++) {
            await e.bot.sendApi('group_poke', {
                group_id: groupId,
                user_id: targetId
            });
            await this.delay(pokeTime); // 等待设定的戳间隔时间
        }
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
