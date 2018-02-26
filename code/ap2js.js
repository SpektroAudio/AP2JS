/*
AP2JS - ABLETON PUSH 2 JS DEVELOPMENT KIT
DEVELOPED BY SPEKTRO AUDIO
http://spektroaudio.com/
*/


inlets = 1
outlets = 2

midi_outlet = 0
setoutletassist(midi_outlet, "MIDI Out (connect to midiout)")
info_outlet = 1
setoutletassist(info_outlet, "Info Out (connect to route)")

ap2js_version = 0.05

grid_note_offset = 36
device_button_offset = 20
grid_width = 8
grid_height = 8
var value = 1
default_on_color = 1;
default_blink_rate = 16;
var data_stream = false;
var data_stream_size = 20;
var midi_message = []
var pad_colors = {
	36 : [0, 1]
}
var push_mode = 0;
var require_user_mode = 1;
var parallel_mode = 1;

var button_colors = {}

var scenes = {
	"user" : {
		"pads" : {},
		"buttons" : {},
		"touchstrip" : 0
	},
	"clear" : {
		"pads" : {},
		"buttons" : {},
		"touchstrip" : 0
	}
};
var pad_last_color = {};
var button_last_color = {};

var touchstrip_value = 0;
var pads_output_mode = 0;
var touchstrip_mode = "default";
var last_scene = "";

var button_list = {
	"setup" : [30, 0],
	"user" : [59,0],
	"add_device" : [52, 0],
	"add_track" : [53, 0],
 	"device" :  [110, 0],
 	"mix" : [112, 0],
 	"browse" : [111, 0],
 	"clip" : [113, 0],
	"master" : [28, 0],
	"up" : [46, 0],
	"down" : [47, 0],
	"left" : [45,0],
	"right" : [44,0],
	"repeat" : [56,0],
	"accent" : [57,0],
	"scale" : [58, 0],
	"layout" : [31,0],
	"note" : [50,0],
	"session" : [51, 0],
	"octave_up" : [55,0],
	"octave_down" : [54,0],
	"page_forward" : [63,0],
	"page_backward" : [62,0],
	"shift" : [49,0],
	"select" : [48,0],
	"tap_tempo" : [3, 0],
	"metronome" : [9, 0],
	"delete" : [118, 0],
	"undo" : [119, 0],
	"mute" : [60, 1],
	"solo" : [61, 1],
	"stop" : [29, 1],
	"convert" : [35, 0],
	"double_loop" : [117, 0],
	"quantize" : [116, 0],
	"duplicate" : [88, 0],
	"new": [87, 0],
	"fixed_length" : [90, 0],
	"play" : [85, 1],
	"record" : [86, 1],
	"automate" : [89, 1],
	"track_1" : [102, 1],
	"track_2" : [103, 1],
	"track_3" : [104, 1],
	"track_4" : [105, 1],
	"track_5" : [106, 1],
	"track_6" : [107, 1],
	"track_7" : [108, 1],
	"track_8" : [109, 1],
	"device_1" : [20, 1],
	"device_2" : [21, 1],
	"device_3" : [22, 1],
	"device_4" : [23, 1],
	"device_5" : [24, 1],
	"device_6" : [25, 1],
	"device_7" : [26, 1],
	"device_8" : [27, 1],
	"scene_1" : [43, 1],
	"scene_2" : [42, 1],
	"scene_3" : [41, 1],
	"scene_4" : [40, 1],
	"scene_5" : [39, 1],
	"scene_6" : [38, 1],
	"scene_7" : [37, 1],
	"scene_8" : [36, 1]
}

var encoder_numbers = [14, 15, 71, 72, 73, 74, 75, 76, 77, 78, 79]

// SET PRIVATE FUNCTIONS
get_pad_nn.local = 1;
get_pad_xy.local = 1;
get_pad_state.local = 1;
get_pad_color.local = 1;
get_pad_lastcolor.local = 1;
clip_x.local = 1;
clip_y.local = 1;
get_button_name.local = 1;
get_button_cc.local = 1;
get_button_state.local = 1;
get_button_type.local = 1;
get_button_color.local = 1;
get_encoder_name.local = 1;
get_encoder_state.local = 1;
toBinary.local = 1;

// GLOBAL FUNCTIONS

function loadbang() {
	post("\n", "AP2JS v" + ap2js_version, "-", "Developed by Spektro Audio")
}

function initialize(){
	print("Initializing...")
	parallel(0);
	set_mode("user");
	set_touchstrip_mode("default");
	scene("user");
}

function set_mode(mode) {
	if (parallel_mode != 1) {
		available_modes = {
			"live": 0,
			"user": 1,
			"both": 2,
		}
		mode_number = available_modes[mode];
		if (mode in available_modes) {
			print("Setting Push 2 to mode: " + mode_number + " (" + mode + ")");
		}
		else {
			error("\n", "[ap2js] Invalid mode. Setting Push 2 to Live mode.")
			mode = 0;
		}
		initialize_command = [240, 0, 33, 29, 1, 1, 10, mode_number, 247]
		for (var i = 0; i < initialize_command.length; i++) {
			outlet(midi_outlet, initialize_command[i]);
		}
	}
	else {
		error("\n", "[ap2js] Can't change Push 2 mode: Max for Live mode enabled.")
	}
}

function parallel(i) {
	if (i == 0 || i == 1) {
		parallel_mode = i;
	}
}

function set_blinkrate(i) {
	if (isNaN(i) == true) {
		error("\n", "set_blinkrate: invalid value")
		i = 16;
	}
	if (i > 16 || i < 0) {
		i = 16;
	}
	default_blink_rate = i;
}

function get_pads_colordict() {
	for (key in pad_colors) {
		print(key + ": " + pad_colors[key])
	}
}

function get_pads_lastcolordict() {
	for (key in pad_last_color) {
		print(key + ": " + pad_last_color[key])
	}
}

function get_pads_scenecolordict() {
	color_dict = scenes[last_scene]["pads"]
	print("dictname: " + last_scene)
	for (key in color_dict) {
		print(key + ": " + pad_last_color[key])
	}
}

// MIDI / SYSEX

function msg_int(i) {
	if (data_stream == false) {
		if (i == 240 || (i > 100 && i < 200)) {
			//post("starting data stream")
			midi_message = []
			midi_message.push(i)
			data_stream = true;
		}
		if (i > 142 && i < 192 || i == 128) {
			data_stream_size = 3;
		}
		else {
			data_stream_size = 10;
		}
	}
	else if (data_stream == true){
		if (i == 247 || (midi_message.length + 1) >= data_stream_size) {
			//post("\n", "finishing data stream")
			data_stream = false;
			midi_message.push(i)
			//post("\n", midi_message)
			parse_midi_message(midi_message);
		}
		else {
		//post("\n", "appending value:", i)
		midi_message.push(i)
		}
	}
}

function parse_midi_message(midi_msg) {
	//post("\n", "midi_msg:", midi_msg)
	if (midi_msg.length == 3) {
		if (midi_msg[0] == 144 || midi_msg[0] == 128) {
			// MIDI NOTES
			get_pad_state(midi_msg[1], midi_msg[2]);
		}
		if (midi_msg[0] == 176) {
			if (midi_msg[1] == 1) {
				outlet(info_outlet, "touchstrip", midi_msg[2]);
			}
			else if (encoder_numbers.indexOf(midi_msg[1]) != -1) {
			// ENCODERS
				get_encoder_state(midi_msg[1], midi_msg[2])
			}
			else {
			// BUTTONS
			get_button_state(midi_msg[1], midi_msg[2])
			}
		}
	}
	else if (midi_msg.length == 9) { 
		sysex_command = [midi_msg[6], midi_msg[7]]
		parse_sysex(sysex_command)
	}
	else {
		print("Unindentified MIDI Message: " + midi_msg)
	}
}

function parse_sysex(sysex_command) {
	sysex_id = sysex_command[0]
	sysex_args = sysex_command[1]
	switch(true) {
		case sysex_id == 10:
			push_mode = sysex_args;
			print("HARDWARE RESPONSE] Push 2 set to mode: " + push_mode)
			mode_number = push_mode;
			if (mode_number == 1 && parallel_mode == 1) {
				restore_pads();
				restore_buttons();
				restore_touchstrip();
			}
			break;
	}
}

function scene(scene_name) {
	print("Selecting scene: " + scene_name)
	if (last_scene != scene_name) {
		if (scene_name in scenes) {
			last_scene = scene_name;
		}
		else {
			print("Scene not found. Creating new scene.")
			last_scene = scene_name;
			scenes[scene_name] = {
				"pads": {},
				"buttons": {},
				"touchstrip" : 0
			}
		}
		restore_pads();
		restore_buttons();
		restore_touchstrip();
	}
}

function print(message) {
	post("\n", "[ap2js]", message)
}


// PAD FUNCTIONS

function get_pad_nn(x, y) {
	nn = grid_note_offset + x + (y * grid_width)
	return nn
}

function get_pad_xy(nn) {
	nn = nn - grid_note_offset;
	y = Math.floor(nn / grid_height);
	x = nn - (y * grid_height);
	xy = [x,y]
	return xy
}

function get_pad_state(nn, value) {
	total_buttons = grid_height * grid_width
	if (nn >= grid_note_offset && (nn - grid_note_offset) < total_buttons) {
		xy = get_pad_xy(nn)
		if (pads_output_mode == 0) {
			if (value != 0) {
				outlet(info_outlet, "xy", xy[0], xy[1], value);
			}
		}
		else {
			outlet(info_outlet, "xy", xy[0], xy[1], value);
		}
	}
}

function get_pad_color(x, y, i) {
	nn = get_pad_nn(x, y);
	if (nn in pad_colors) {
		return pad_colors[nn][i];
	}
	else {
		return i
	}
} 

function get_pad_lastcolor(nn) {
	if (nn in scenes[last_scene]["pads"]) {
		lastcolor = scenes[last_scene]["pads"][nn]
		return lastcolor
	}
	else {
		return 0
	}
}

function set_pad_color(x, y, off, on) {
	nn = get_pad_nn(x, y);
	pad_colors[nn] = [off, on];
}

function set_row_color(y, off, on) {
	for (var i = 0; i < grid_width; i++) {
		set_pad_color(i, y, off, on);
	}
}

function set_column_color(x, off, on) {
	for (var i = 0; i < grid_height; i++) {
		set_pad_color(x, i, off, on);
	}
}

function set_allpads_color(off, on) {
	for (var i = 0; i < grid_width; i++) {
		set_column_color(i, off, on);
	}
}

function set_pad(x, y, value) {
	is_symbol = isNaN(value);
	nn = get_pad_nn(x,y);
	if (pad_last_color[nn] != value) {
		if (is_symbol == 0) {
			note_out(nn, value, 1);
		}
		else if (is_symbol == 1) {
			if (value == "on") {
				value = 1;
			}
			else if (value == "off") {
				value = 0;
			};
			value = get_pad_color(x, y, value);
			note_out(nn, value, 1);
		}
		pad_last_color[nn] = value;
		scenes[last_scene]["pads"][nn] = value;
	}
}

function set_pad_blink(x, y, value) {
	set_pad(x, y, "off");
	if (value == 1) {
	note_out(get_pad_nn(x,y), get_pad_color(x, y, value), default_blink_rate);
	}
}

function set_row(y, value) {
	for (var i = 0; i < grid_width; i++) {
		set_pad(i, y, value);
	}
}

function set_row_b(y, value) {
	value_array = toBinary(value);
	string_values = ["off", "on"]
	for (var i = 0; i < grid_width; i++) {
		set_pad(i, y, string_values[value_array[7 - i]]);
	}
}

function clear_row(y) {
	set_row(y, "off");
}

function set_column(x, value) {
	for (var i = 0; i < grid_height; i++) {
		set_pad(x, i, value);
	}
}

function set_column_b(x, value) {
	value_array = toBinary(value);
	string_values = ["off", "on"]
	for (var i = 0; i < grid_height; i++) {
		set_pad(x, i, string_values[value_array[7 - i]]);
	}
}

function clear_column(x) {
	set_column(x, "off");
}

function clear_all() {
	for (var i = 0; i < grid_width; i++) {
		clear_column(i);
	}
}

function set_row_fill(y, fill, value) {
	if (fill > grid_width) {
		fill = grid_width;
	}

	is_symbol =  isNaN(i);

	for (var i = 0; i < fill; i++) {
		set_pad(i, y, value);
	}
	for (var i = grid_width; i >= fill; i--) {
		if (is_symbol == 0) {
			set_pad(i, y, 0);
		}
		else if (is_symbol == 1) {
			set_pad(i, y, "off");
		}
	}

}

function set_column_fill(x, fill, value) {
	if (fill > grid_height) {
		fill = grid_height;
	}

	is_symbol =  isNaN(i);
	
	for (var i = 0; i < fill; i++) {
		set_pad(x, i, value);
	}

	for (var i = grid_height; i >= fill; i--) {
		if (is_symbol == 0) {
			set_pad(x, i, 0);
		}
		else if (is_symbol == 1) {
			set_pad(x, i, "off");
		}
	}
}


function set_row_exclusive(x, y) {
	x = clip_x(x);
	y = clip_y(y);
	set_row(y, "off");
	set_pad(x,y,"on");
}

function set_column_exclusive(x, y) {
	x = clip_x(x);
	y = clip_y(y);
	set_column(x, "off");
	set_pad(x,y,"on");
}


function set_xy_exclusive(x, y) {
	x = clip_x(x);
	y = clip_y(y);
	clear_all();
	set_pad(x,y,"on");
}

function clip_x(x) {
	if (x < 0) {
		x = 0;
	};
	x = x % grid_width;
	return x;
}

function clip_y(y) {
	if (y < 0) {
		y = 0;
	};
	y = y % grid_height;
	return y;
}

function restore_pads(){
	for (var i = grid_note_offset; i < ((grid_height * grid_width) + grid_note_offset); i++) {
	//for (key in scenes[last_scene]["pads"]) {
		key = parseInt(i);
		if (key in scenes[last_scene]["pads"]) {
			color = parseInt(scenes[last_scene]["pads"][key]);
			note_out(key, color, 1);
			pad_last_color[key] = color;
		}
		else {
			note_out(key, 0, 1);
			pad_last_color[key] = 0;
		}
		/*
		if (pad_last_color[key] != color) {
			note_out(key, 0, 1);
			note_out(key, color, 1);
			pad_last_color[key] = color;
		}
		*/
	}
}

function set_pads_outputmode(mode) {
	if (mode != 0 && mode != 1) {
		mode = 1
	}
	pads_output_mode = mode;
}

// BUTTON FUNCTIONS

function get_button_name(cc) {
	for (key in button_list) {
		if (button_list[key][0] == cc) {
			name = key
			return name
		}
	}
	error("\n", "[ap2js] get_button_name: button not found")
}


function get_button_cc(name) {

	is_name_symbol = isNaN(name)

	if (is_name_symbol == 1) {
		if (name in button_list) {
			return button_list[name][0]
		}
		else {
			error("\n", "[ap2js] get_button_cc: invalid button name")
		}
	}
	else {
		return name
	}
}

function get_button_state(cc, value) {
	name = get_button_name(cc);
	outlet(info_outlet, "button", name, value);
}

function get_button_type(name) {
	if (name in button_list) {
		i = button_list[name][1]
		if (i == 0) {
			outlet(info_outlet, "button_type", name, "mono");
		}
		else if (i == 1) {
			outlet(info_outlet, "button_type", name, "rgb");
		}
	}
	else {
		error("\n", "[ap2js] get_button_type: invalid button name")
	}
}

function get_button_color(name, value) {
	cc = get_button_cc(name);

	is_value_symbol = isNaN(value);
	if (is_value_symbol == 1) {
		if (value == "on") {
			value = 1;
		}
		else if (value == "off") {
			value = 0;
		}
		else {
			value = 0;
		}
	}

	if (cc in button_colors) {
		return button_colors[cc][value];
	}
	else {
		if (value != 0) {
			value = 127
		}
		return value
	}
} 

function set_button_color(name, off, on) {
	if (name in button_list) {
		cc = get_button_cc(name);
		button_colors[cc] = [off, on];
	}
	else {
		error("\n", "[ap2js] set_button_color: invalid button name")
	}
}

function set_button(name, value) {
	is_value_symbol = isNaN(value);
	is_name_symbol = isNaN(name)
	if (is_name_symbol == 1) {
			name = get_button_cc(name)
	}
	if (button_last_color != value) {

		if (is_value_symbol == 0) {
			cc_out(name, value, 1);
		}
		else if (is_value_symbol == 1) {
			if (value == "on") {
				value = 1;
			}
			else if (value == "off") {
				value = 0;
			};
			value = get_button_color(name, value);
			cc_out(name, value, 1);
		}
		button_last_color[name] = value;
		scenes[last_scene]["buttons"][name] = value;
	}
}

function set_button_blink(name, value) {
	set_button(name, "off");
	set_button(name, "off");
	if (value == 1) {
	cc_out(get_button_cc(name), get_button_color(name, "on"), default_blink_rate);
	}
}

function get_button_list() {
	print("Printing list of all available buttons... ")
	for (var key in button_list) {
		print(key);
	}
}


function restore_buttons(){
	for (key in button_list) {
		print("Restoring buttons: " + key)
		key = parseInt(get_button_cc(key));
		if (key in scenes[last_scene]["buttons"]) {		
			color = parseInt(scenes[last_scene]["buttons"][key]);
			cc_out(key, color, 1);
			button_last_color[key] = color;
		} else {
			key = parseInt(get_button_cc(key));
			cc_out(key, 0, 1);
			button_last_color[key] = 0;
		}
	}
}

function randomize_all_buttons() {
	for (key in button_list){
		color = Math.floor(Math.random() * 127)
		set_button(key, color, 1);
	}
}

// TOUCHSTRIP
function set_touchstrip_mode(mode) {
	tstrip_address = [240, 0, 33, 29, 1, 1, 23];
	mode_list = {
		"pitch-bend" : 104,
		"mod-wheel" : 4,
		"default" : 5,
		"centered" : 21,
		"bottom" :  37,
		"sysex" : 7
	};
	print("Setting touchstrip to mode: " + mode);
	touchstrip_mode = mode;
	for (var i = 0; i < tstrip_address.length; i++) {
		outlet(midi_outlet, tstrip_address[i]);
	}
	outlet(midi_outlet, mode_list[mode]);
	outlet(midi_outlet, 247);
}

function set_touchstrip(value) {
	if (value != touchstrip_value) {
		cc_out(1, value, 1);
		touchstrip_value = value;
		scenes[last_scene]["touchstrip"] = parseInt(value);
	}
}

function restore_touchstrip() {
	tvalue = scenes[last_scene]["touchstrip"]
	set_touchstrip_mode(touchstrip_mode);
	for (var i; i < 900000; i++) {
	}
	cc_out(1, parseInt(tvalue), 1);
}

// ENCODERS

function get_encoder_name(cc) {
	switch (true) {
		case cc > 70 && cc < 79:
			label = "track_encoder_" + (cc - 70);
			break;
		case cc == 14:
			label = "bpm_encoder";
			break;
		case cc == 15:
			label = "swing_encoder";
			break;
		case cc == 79:
			label = "master_encoder";
			break;
	}
	return label
}

function get_encoder_state(cc, value){
	if (value == 127) {
	outlet(info_outlet, "encoder", get_encoder_name(cc), "dec", "bang") 
	}
	else if (value == 1) {
	outlet(info_outlet, "encoder", get_encoder_name(cc), "inc", "bang") 
	}

}

// MIDI & MISC FUNCTIONS

function note_out(note, vel, ch) {
	note = parseInt(note);
	vel = parseInt(vel);
	ch = parseInt(ch);
	if (ch < 1) {
		ch = 1;
	};
	if ((require_user_mode == 1 && push_mode != 0) || require_user_mode == 0) {
		//post("\n", "[ap2js] midiout:", note, vel, ch)
		outlet(midi_outlet, 143 + ch);
		outlet(midi_outlet, note);
		outlet(midi_outlet, vel);
	}
	else if (require_user_mode == 1 && push_mode == 0) {
		if (parallel == 0) {
			error("\n", "[ap2js] Push 2 set to Live mode. Please initialize.")
		}
	}
	
}

function cc_out(cc, vel, ch) {
	cc = parseInt(cc);
	vel = parseInt(vel);
	ch = parseInt(ch);
	if (ch < 1) {
		ch = 1;
	};
	if ((require_user_mode == 1 && push_mode != 0) || require_user_mode == 0) {
		outlet(midi_outlet, 175 + ch);
		outlet(midi_outlet, cc);
		outlet(midi_outlet, vel);
	}
	else if (require_user_mode == 1 && push_mode == 0) {
		if (parallel == 0) {
			error("\n", "[ap2js] Push 2 set to Live mode. Please initialize.")
		}
	}
	
}


function toBinary(value) {
	value_array = [0, 0, 0, 0, 0, 0, 0, 0,]
	if (value > 255 || value < 0) {
		value = 0;
	}
	newValue = parseInt(value, 10).toString(2);
	for (var i = newValue.length - 1; i >= 0; i--) {
		index1 = (value_array.length - 1) - i;
		index2 = (newValue.length - 1) - i;
		value_array[index1] = newValue[index2]
	}
	return value_array;
}
