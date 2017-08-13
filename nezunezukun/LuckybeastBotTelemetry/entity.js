module.exports = inject;

function inject(bot)
{
    var entity = {
        bot: bot,

        me: null,
        entities: [],

        get: function()
        {
            var entitiesViewModel = {
                me: this.me,
                entities: []
            };

            for(i = 0; i <= this.entities.length; i++)
            if(this.entities[i] != null)
            {
                entitiesViewModel.entities.push(this.entities[i]);
            }

            return entitiesViewModel;
        },

        // エンティティがスポーン
        onEntitySpawn: function(e)
        {
            this.entities[e.id] = e;
        },

        // エンティティが消滅
        onEntityGone: function(e)
        {
            delete this.entities[e.id];
        },

        // エンティティが移動
        onEntityMoved: function(e)
        {
            this.entities[e.id] = e;
        },

        onMeMoved: function(e)
        {
            this.me = e;
        }
    };

    bot.on('entitySpawn', (function(e) { entity.onEntitySpawn(e) }).bind(entity));
    bot.on('entityGone', (function(e) { entity.onEntityGone(e) }).bind(entity));
    bot.on('entityMoved', (function(e) { entity.onEntityMoved(e) }).bind(entity));
    bot.on('move', (function() { entity.onMeMoved(bot.entity) }).bind(entity));

    return entity;
}
