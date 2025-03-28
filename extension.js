/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const AudioDeviceSelectionDBus = imports.ui.audioDeviceSelection.AudioDeviceSelectionDBus;
const AudioDevice = imports.ui.audioDeviceSelection.AudioDevice;
const Main = imports.ui.main;
const { GLib } = imports.gi;

const AutoSelectHeadsetAsync = function(params, invocation) {
    let [deviceNames] = params;
    let deviceName = 'headphones';
    if (deviceNames.indexOf('headphones') < 0) {
        deviceName = 'microphone';
    } else if (deviceNames.indexOf('microphone') < 0) {
        invocation.return_value(null);
        return;
    }
    let connection = Main.shellAudioSelectionDBusService._dbusImpl.get_connection();
    let info = Main.shellAudioSelectionDBusService._dbusImpl.get_info();
    connection.emit_signal(invocation.get_sender(),
                           Main.shellAudioSelectionDBusService._dbusImpl.get_object_path(),
                           info ? info.name : null,
                           'DeviceSelected',
                           GLib.Variant.new('(s)', [deviceName]));
    invocation.return_value(null);
}

let originalOpenAsync = null;
class AutoSelectHeadsetExtension {
    constructor() {
    }

    replace() {
        originalOpenAsync = Main.shellAudioSelectionDBusService.OpenAsync;
        Main.shellAudioSelectionDBusService.OpenAsync = AutoSelectHeadsetAsync
    }

    enable() {
        GLib.idle_add(GLib.PRIOIRTY_DEFAULT, () => {
            if (Main.shellAudioSelectionDBusService) {
                this.replace();
            } else {
                this.enable();
            }
        });
    }

    disable() {
        if (originalOpenAsync) {
            Main.shellAudioSelectionDBusService.OpenAsync = originalOpenAsync;
        }
    }
}

function init() {
    return new AutoSelectHeadsetExtension();
}
