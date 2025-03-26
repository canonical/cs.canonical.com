// TODO: Remove this file before merging. Only for testing purposes.
import { exec } from "child_process";

export function startVPN() {
  return new Promise((resolve, reject) => {
    exec(`nmcli con up id "${process.env.LOCAL_VPN_ID}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error starting VPN: ${error.message}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

export function stopVPN() {
  return new Promise((resolve, reject) => {
    exec(`nmcli con down id "${process.env.LOCAL_VPN_ID}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error stopping VPN: ${error.message}`);
      } else {
        resolve(stdout);
      }
    });
  });
}
