exports.start_eat = start_eat;
exports.end_eat = end_eat;

var original_item = false;

function start_eat(bot){
    if(!isFood(bot.heldItem))
      original_item = bot.heldItem;
    console.log("start eating, original_item = " + original_item);
    var items = bot.inventory.items();
    items.forEach(function(v, i, a){
      if(isFood(v)){
        bot.equip(v, "hand");
        bot.activateItem();
      }
    });
}

function end_eat(bot){
    bot.deactivateItem();
    console.log("end eating, original_item = " + original_item);
    var items = bot.inventory.items();
    if(original_item)
      bot.equip(original_item, "hand");
    original_item = false;
}

function isFood(item)
{
  if(m = item.name.match(/porkchop$/))
    return true;
  else
    return false;
};
