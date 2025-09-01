import path from "path";
import { Service } from "node-windows";

const svc = new Service({
  name: 'WolfGym Fingerprint Service',
  script: path.join(__dirname, 'windows-service.js')
});

svc.on('uninstall', () => console.log('Servicio desinstalado.'));
svc.on('error', (err) => console.error('Error desinstalando:', err));

svc.uninstall();