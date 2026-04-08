var rconParser;
var eventParser;

/**
 * CoD2 + zk_libcod: RCon status2 (CSV) + log lines with semicolon tokens:
 *   Connected;networkId;slot;name
 *   disconnected;networkId;slot;name   (add Disconnected too if your mod uses it)
 *   Damage;... / Kill;... (target id/slot/name/team then attacker id/slot/name/team then weapon;damage;MOD;hit)
 *
 * GameEvent.EventType ordinals: PreConnect=9, PreDisconnect=10, Damage=302, Kill=303
 *
 * Chat / comandos: apenas linhas libcod no formato:
 *   Chat;say;networkId;slot;team;name;message
 *   Chat;sayteam;... (mesmo layout)
 * Linhas stock say;sayteam; no games_mp.log sao ignoradas (IgnoreClassicSayLogLines).
 * O id deve ser o mesmo que em Connected / status2. Prefixo \\x15 (LocalizeText) e removido no parser.
 */
var plugin = {
    author: 'brolpzt (zk_libcod status2)',
    version: 0.6,
    name: 'CoD2x (libcod status2) Parser',
    isParser: true,

    onEventAsync: function (gameEvent, server) {
    },

    onLoadAsync: function (manager) {
        rconParser = manager.GenerateDynamicRConParser(this.name);
        eventParser = manager.GenerateDynamicEventParser(this.name);

        rconParser.Configuration.RConStatusCommand = 'status2';

        rconParser.Configuration.StatusHeader.Pattern = 'num,score,ping,hwid2,name,lastmsg,address,qport,rate';
        // hwid2: zk_libcod prints cl_hwid2 or "0" — allow up to 64 chars (no comma); long hex uses full string hash in ConvertGuidToLong
        rconParser.Configuration.Status.Pattern =
            '^([0-9]+),(-?[0-9]+),(CNCT|ZMBI|[0-9]{1,4}),([^,]{1,64}),(.*?)\\^7,([0-9]+),([^,]+),(-?[0-9]+),([0-9]+)$';
        rconParser.Configuration.Status.AddMapping(100, 1);
        rconParser.Configuration.Status.AddMapping(101, 2);
        rconParser.Configuration.Status.AddMapping(102, 3);
        rconParser.Configuration.Status.AddMapping(103, 4);
        rconParser.Configuration.Status.AddMapping(104, 5);
        rconParser.Configuration.Status.AddMapping(105, 7);

        rconParser.Configuration.CommandPrefixes.RConResponse = '\xff\xff\xff\xffprint\n';

        // CoD2 / libcod: dvar print is usually "name" is: "value" [default: ...] without CoD4x "info:" line
        rconParser.Configuration.Dvar.Pattern =
            '^"(.+)" is: "(.*)"(?: default: "(.*)")?(?:\\s+latched:\\s*"(.*)")?(?:\\s+info:\\s*"(.*)")?\\s*$';
        rconParser.Configuration.Dvar.AddMapping(106, 1);
        rconParser.Configuration.Dvar.AddMapping(107, 2);
        rconParser.Configuration.Dvar.AddMapping(108, 3);
        rconParser.Configuration.Dvar.AddMapping(109, 4);
        rconParser.Configuration.Dvar.AddMapping(110, 5);

        rconParser.Configuration.DefaultDvarValues.Add('version', 'CoD2x + zk_libcod status2');
        rconParser.Configuration.DefaultDvarValues.Add('sv_running', '1');

        rconParser.Configuration.NoticeLineSeparator = '. ';
        rconParser.Configuration.DefaultRConPort = 28960;
        rconParser.Version = 'CoD2x + zk_libcod status2';
        rconParser.GameName = -1;
        rconParser.CanGenerateLogPath = true;

        eventParser.Configuration.GameDirectory = 'main';
        eventParser.Configuration.IgnoreClassicSayLogLines = true;
        eventParser.Version = 'CoD2x + zk_libcod status2';
        eventParser.GameName = -1;

        // Semicolon lines only consult the built-in token map (J/Q/K/D). Map mod tokens to EventType ints.
        var lineTypes = eventParser.Configuration.CustomSemicolonLineEventTypes;
        lineTypes.Add('Connected', 9);
        lineTypes.Add('disconnected', 10);
        lineTypes.Add('Disconnected', 10);
        lineTypes.Add('Damage', 302);
        lineTypes.Add('Kill', 303);
        lineTypes.Add('Chat', 100);
        lineTypes.Add('ChatTeam', 99);

        eventParser.Configuration.Join.Pattern = '^(Connected);([^;]+);([0-9]+);(.*)$';
        eventParser.Configuration.Join.AddMapping(0, 1);
        eventParser.Configuration.Join.AddMapping(1, 2);
        eventParser.Configuration.Join.AddMapping(3, 3);
        eventParser.Configuration.Join.AddMapping(5, 4);

        eventParser.Configuration.Quit.Pattern = '^(disconnected|Disconnected);([^;]+);([0-9]+);(.*)$';
        eventParser.Configuration.Quit.AddMapping(0, 1);
        eventParser.Configuration.Quit.AddMapping(1, 2);
        eventParser.Configuration.Quit.AddMapping(3, 3);
        eventParser.Configuration.Quit.AddMapping(5, 4);

        // Prefix without capture so group 1 = victim network id. Order matches mod: victim;attacker;weapon;damage;MOD;hit
        var dmgKillBody =
            '([^;]+);([0-9]+);([^;]+);([^;]*);([^;]+);([0-9]+);([^;]+);([^;]*);([^;]+);([0-9]+);([^;]+);([^;]+)$';

        eventParser.Configuration.Damage.Pattern = '^Damage;' + dmgKillBody;
        eventParser.Configuration.Damage.AddMapping(2, 1);
        eventParser.Configuration.Damage.AddMapping(4, 2);
        eventParser.Configuration.Damage.AddMapping(6, 3);
        eventParser.Configuration.Damage.AddMapping(8, 4);
        eventParser.Configuration.Damage.AddMapping(1, 5);
        eventParser.Configuration.Damage.AddMapping(3, 6);
        eventParser.Configuration.Damage.AddMapping(5, 7);
        eventParser.Configuration.Damage.AddMapping(7, 8);
        eventParser.Configuration.Damage.AddMapping(9, 9);
        eventParser.Configuration.Damage.AddMapping(10, 10);
        eventParser.Configuration.Damage.AddMapping(11, 11);
        eventParser.Configuration.Damage.AddMapping(12, 12);

        eventParser.Configuration.Kill.Pattern = '^Kill;' + dmgKillBody;
        eventParser.Configuration.Kill.AddMapping(2, 1);
        eventParser.Configuration.Kill.AddMapping(4, 2);
        eventParser.Configuration.Kill.AddMapping(6, 3);
        eventParser.Configuration.Kill.AddMapping(8, 4);
        eventParser.Configuration.Kill.AddMapping(1, 5);
        eventParser.Configuration.Kill.AddMapping(3, 6);
        eventParser.Configuration.Kill.AddMapping(5, 7);
        eventParser.Configuration.Kill.AddMapping(7, 8);
        eventParser.Configuration.Kill.AddMapping(9, 9);
        eventParser.Configuration.Kill.AddMapping(10, 10);
        eventParser.Configuration.Kill.AddMapping(11, 11);
        eventParser.Configuration.Kill.AddMapping(12, 12);
    },

    onUnloadAsync: function () {
    },

    onTickAsync: function (server) {
    }
};
