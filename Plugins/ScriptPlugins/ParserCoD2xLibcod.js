var rconParser;
var eventParser;

/**
 * CoD2 + zk_libcod: uses console command status2 (custom_SV_Status2_f) which prints CSV:
 *   num,score,ping,hwid2,name,lastmsg,address,qport,rate
 * hwid2 comes from userinfo cl_hwid2 (longer than CoD4x GUID). IW4MAdmin maps it via
 * ConvertGuidToLong (hex): up to 16 hex digits contribute to NetworkId; "0" falls back to name hash.
 */
var plugin = {
    author: 'brolpzt (zk_libcod status2)',
    version: 0.1,
    name: 'CoD2x (libcod status2) Parser',
    isParser: true,

    onEventAsync: function (gameEvent, server) {
    },

    onLoadAsync: function (manager) {
        rconParser = manager.GenerateDynamicRConParser(this.name);
        eventParser = manager.GenerateDynamicEventParser(this.name);

        rconParser.Configuration.RConStatusCommand = 'status2';

        rconParser.Configuration.StatusHeader.Pattern = 'num,score,ping,hwid2,name,lastmsg,address,qport,rate';
        rconParser.Configuration.Status.Pattern =
            '^([0-9]+),(-?[0-9]+),(CNCT|ZMBI|[0-9]{1,4}),([^,]*),(.*?)\\^7,([0-9]+),([^,]+),(-?[0-9]+),([0-9]+)$';
        rconParser.Configuration.Status.AddMapping(100, 1); // RConClientNumber
        rconParser.Configuration.Status.AddMapping(101, 2); // RConScore
        rconParser.Configuration.Status.AddMapping(102, 3); // RConPing
        rconParser.Configuration.Status.AddMapping(103, 4); // RConNetworkId (hwid2)
        rconParser.Configuration.Status.AddMapping(104, 5); // RConName
        rconParser.Configuration.Status.AddMapping(105, 7); // RConIPAddress

        rconParser.Configuration.CommandPrefixes.RConResponse = '\xff\xff\xff\xffprint\n';

        rconParser.Configuration.Dvar.Pattern = '^"(.+)" is: "(.+)?" default: "(.+)?" info: "(.+)?"$';
        rconParser.Configuration.Dvar.AddMapping(109, 2);
        rconParser.Configuration.Dvar.AddMapping(110, 4);

        rconParser.Configuration.NoticeLineSeparator = '. ';
        rconParser.Configuration.DefaultRConPort = 28960;
        rconParser.Version = 'CoD2x + zk_libcod status2';
        rconParser.GameName = -1; // COD
        rconParser.CanGenerateLogPath = true;

        eventParser.Configuration.GameDirectory = 'main';
        eventParser.Version = 'CoD2x + zk_libcod status2';
        eventParser.GameName = -1; // COD
    },

    onUnloadAsync: function () {
    },

    onTickAsync: function (server) {
    }
};
