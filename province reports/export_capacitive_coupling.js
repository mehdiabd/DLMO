
/**
 * Created by hamid at 07/22/17.
 */
function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

function dot2num(dot) 
{
    var d = dot.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}

//rs.slaveOk();

var lineprofile=" ";
var attnds=0;
var sdate=NumberInt(191207);


//scf_db = db.getSiblingDB("scf");
//dcf_db = db.getSiblingDB("dcf");
//adf_db = db.getSiblingDB("adf");
//rpt_db = db.getSiblingDB("rpt");


scf_db = new Mongo ("mongodb://172.30.96.222:27017,172.30.96.195:27017,172.30.96.196:27017/?replicaSet=SCFrs").getDB("scf");
scf_db.getMongo().setReadPref('secondaryPreferred');

adf_db = new Mongo ("mongodb://172.30.96.235:27017,172.30.96.236:27017,172.30.96.237:27017/?replicaSet=ADFrs").getDB("adf");
adf_db.getMongo().setReadPref('secondaryPreferred');

rpt_db = new Mongo ("mongodb://172.30.96.232:27017,172.30.96.233:27017,172.30.96.234:27017/?replicaSet=RPTrs").getDB("rpt");
rpt_db.getMongo().setReadPref('secondaryPreferred');

dcf_db = new Mongo ("mongodb://172.30.96.230:27017");

result=scf_db.province.findOne({"en_name": "Khuzestan" });
p_id=(result._id.toString().match( /"(.*?)"/ )[1]);

scf_db.network_element.find({"province_id":p_id}).forEach(function(ne) {
    adf_db.line_quality.find({
        "ip_adr":ne['ip_address'],
        "lq_params.resync": {$gt: NumberInt(20)},
        "lq_params.showtime": {$gte: NumberInt(10000), $lte: NumberInt(86400)},
        "sdate": NumberInt(sdate)
    }).forEach(function (rows) {

        result = rpt_db.port_params.findOne({"sdate": sdate, "ip_adr": rows['ip_adr'], "ifx": rows['ifx']});
        if (result != null)
            if (result['SATNds'] < result['SATNus']) {
                result2 = scf_db.network_element.findOne({"ip_address": result['ip_adr']});
                result_province = scf_db.province.findOne({"_id": ObjectId(result2['province_id'])}, {
                    "en_name": 1,
                    "cities": {$elemMatch: {"_id": result2['city_id']}}
                });
                result_exchange = scf_db.exchange.findOne({"_id": ObjectId(result2['exchange_id'])}, {
                    "en_name": 1,
                    "sites": {$elemMatch: {"_id": result2['site_id']}}
                });
                //print (JSON.stringify(result_exchange));
                if (result2 != null) result3 = scf_db.network_device.findOne({"_id": ObjectId(result2['network_device_id'])}, {"interface_indexes": {$elemMatch: {"if_index": rows['ifx']}}});
                if (result3 != null && result3['interface_indexes'] != null) {
                    slot = NumberInt(result3['interface_indexes'][0]['slot']);
                    port = NumberInt(result3['interface_indexes'][0]['port']);
                    n_id = (result2['_id'].toString().match(/"(.*?)"/)[1]);
                    phone = scf_db.network_element_port.findOne({"if_index": rows['ifx'], "network_element_id": n_id});
                    if (!phone) phone = "";
                    if (result_exchange['sites'] && result_province && result_province['cities'] && result_exchange && phone['phone_number'])
                        print(result_province['en_name'] + "," + result_province['cities'][0]['en_name'] + "," + result_exchange['en_name'] + "," + result_exchange['sites'][0]['en_name'] + "," + rows['ip_adr'] + "," + slot + "/" + port + "," + phone['phone_number']);
                }
            }

    });
});

