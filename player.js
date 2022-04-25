"strict mode";

function Player(socketId){
    this.socketId = socketId;
    this.pos = null;
    this.action = "walk";
    this.signText = "";
    this.avatarKey = "";
}

Player.prototype = {

    updatePosition: function(value){
        this.pos = value;
    },

    updateSign: function(value){
        this.signText = value;
    },

    updateAvatarKey: function(value){
        this.avatarKey = value;
    },

    getPosInfo: function(){
        return this.pos;
    },
    
    getInfo: function(){
        return {pos:this.pos, sign:this.signText, avatarKey: this.avatarKey};
    },
    
}

module.exports = Player;