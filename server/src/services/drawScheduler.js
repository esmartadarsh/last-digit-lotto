const { Draw, Game } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { syncDrawStatusToFirestore, createDrawInFirestore } = require('./firestoreSync');

/**
 * Called by cron every minute.
 * Closes any draw whose scheduled_at time has passed and is still 'open'.
 */
async function closeExpiredDraws() {
  try {
    const expired = await Draw.findAll({
      where: {
        status: 'open',
        scheduled_at: { [Op.lte]: new Date() },
      },
    });

    for (const draw of expired) {
      await draw.update({ status: 'closed' });
      await syncDrawStatusToFirestore(draw.id, 'closed');
    }

    if (expired.length > 0) {
      console.log(`✅ Closed ${expired.length} expired draw(s)`);
    }
  } catch (err) {
    console.error('❌ closeExpiredDraws error:', err.message);
  }
}

/**
 * Called by cron at midnight.
 * Auto-creates today's draws for all active games.
 * Lottery games get one draw at 1PM.
 * ABC games get two draws: 1PM and 8PM.
 */
async function createDailyDraws() {
  try {
    const games = await Game.findAll({ where: { is_active: true } });
    const today = new Date();

    for (const game of games) {
      if (game.type === 'lottery') {
        const scheduledAt = new Date(today);
        scheduledAt.setHours(13, 0, 0, 0);

        const draw = await Draw.create({
          id: uuidv4(),
          game_id: game.id,
          scheduled_at: scheduledAt,
          ticket_price: 7,
        });
        await createDrawInFirestore(draw.id, draw);

      } else if (game.type === 'abc') {
        const slots = [
          { label: '1PM', hour: 13, price: 10.4 },
          { label: '8PM', hour: 20, price: 11 },
        ];

        for (const slot of slots) {
          const scheduledAt = new Date(today);
          scheduledAt.setHours(slot.hour, 0, 0, 0);

          const draw = await Draw.create({
            id: uuidv4(),
            game_id: game.id,
            scheduled_at: scheduledAt,
            time_slot: slot.label,
            ticket_price: slot.price,
          });
          await createDrawInFirestore(draw.id, draw);
        }
      }
    }

    console.log('✅ Daily draws created');
  } catch (err) {
    console.error('❌ createDailyDraws error:', err.message);
  }
}

module.exports = { closeExpiredDraws, createDailyDraws };
