/**
 * Created by hamid azizjan at 07/22/17.
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

var province="Ardabil";
var sdate=NumberInt(191207);
var state="Unstable";
var attnds=0;
var attnus=0;
var adrds=0;
var adrus=0;
var snrus=0;
var snrds=0;
var satnus=0;
var satnds=0;
var index=" ";
var ip=" ";
var city=" ";
var exchange=" ";
var site=" ";
var distance=0;

scf_db = new Mongo ("mongodb://172.30.96.222:27017,172.30.96.195:27017,172.30.96.196:27017/?replicaSet=SCFrs").getDB("scf");
scf_db.getMongo().setReadPref('secondaryPreferred');

adf_db = new Mongo ("mongodb://172.30.96.235:27017,172.30.96.236:27017,172.30.96.237:27017/?replicaSet=ADFrs").getDB("adf");
adf_db.getMongo().setReadPref('secondaryPreferred');

rpt_db = new Mongo ("mongodb://172.30.96.232:27017,172.30.96.233:27017,172.30.96.234:27017/?replicaSet=RPTrs").getDB("rpt");
rpt_db.getMongo().setReadPref('secondaryPreferred');

print ("Province,City,Exchange,Site,DSLAM,IP,Slot,Port,Phone,Distance");



result=scf_db.province.findOne({"en_name": province });
p_id=(result._id.toString().match( /"(.*?)"/ )[1]);

scf_db.network_element.find({"province_id":p_id}).forEach(function(ne){
        //print (JSON.stringify(prow));
    adf_db.line_quality.find({"ip_adr":ne['ip_address'], "sdate":sdate, 'state': state}).forEach(function(arow) {
        city= scf_db.province.findOne({"en_name":province},{"cities":{$elemMatch:{"_id":ne['city_id']}}});
        exchange=scf_db.exchange.findOne({"_id":ObjectId(ne['exchange_id'])});
        site= scf_db.exchange.findOne({"_id":ObjectId(ne['exchange_id'])},{"sites":{$elemMatch:{"_id":ne['site_id']}}});
        index=scf_db.network_device.findOne({"_id":ObjectId(ne['network_device_id'])}, {interface_indexes: {$elemMatch:{"if_index":arow['ifx']}}});
        n_id=(ne['_id'].toString().match( /"(.*?)"/ )[1]);
        phone=scf_db.network_element_port.findOne({"if_index":arow['ifx'],"network_element_id": n_id})['phone_number'];
        dist=rpt_db.port_params.findOne({"sdate":sdate,"ip_adr":ne['ip_address'],"ifx":arow['ifx']});
        if (!dist)
            distance=-1;
        else distance=(Math.round((((dist['SATNus']/10)-2.5)/7.5)*10) / 10);
        if (!phone) phone="";
        if (city.cities && exchange && site.sites && index.interface_indexes)
            print (province+","+city['cities'][0]['en_name']+","+exchange['en_name']+","+site['sites'][0]['en_name']+","+ne['name']+","+ne['ip_address']+","+index['interface_indexes'][0]['slot']+","+index['interface_indexes'][0]['port']+","+phone+","+distance);
    });

});
