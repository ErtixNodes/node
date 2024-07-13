require('dotenv').config();
var Docker = require('dockerode');
const superagent = require('superagent');

var docker = new Docker();

const db = require('./db');

setInterval(run, 15*1000);

let isRun = false;

run();

async function run() {
    if (isRun == true) return;
    isRun = true;
    var containers = await docker.listContainers();
    console.log(`Found ${containers.length} containers!`);
    for (let i = 0; i < containers.length; i++) {
        try {
            const ct = containers[i];
    
            var dockerCT = docker.getContainer(ct.Id);
            var inspect = await dockerCT.inspect();
    
            var name = String(inspect.Name).replace('/', '');
    
            var stat = await dockerCT.stats({ stream: false });
    
            var net = stat.networks['eth0'].tx_bytes;
            var netInMB = net / Math.pow(10, 6);
    
            console.log('stat', stat, net, netInMB + 'MB');
    
            let suspend = false;
            if (netInMB > 250) {
                suspend = true;
                try {
                    dockerCT.kill();
                } catch(e) {
                    console.log('cant kill CT', e);
                }
            }
    
            var res = await superagent
                .get(`${process.env.REMOTE}/dash/node/charge/${process.env.TOKEN}/${name}?suspend=${suspend}`);
    
            // console.log(res);  
        } catch(e) {
            console.log('Failed to check container');
        }
    }

    isRun = false;
}
