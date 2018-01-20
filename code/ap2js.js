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

ap2js_version = 0.02

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

var button_colors = {
	36 : [0, 1]
}

var pad_last_color = {
	36: 1
}

var button_list = {
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
	"device_8" : [27, 1]
}

var encoder_numbers = [14, 15, 71, 72, 73, 74, 75, 76, 77, 78, 79]


// GLOBAL FUNCTIONS

function loadbang() {
	post("\n", "AP2JS v" + ap2js_version, "-", "Developed by Spektro Audio")
}

function initialize(){
	set_mode("user");
	set_touchstrip_mode("default");
}

function set_mode(mode) {
	available_modes = {
		"live": 0,
		"user": 1,
		"both": 2,
	}
	if (mode in available_modes) {
		mode_number = available_modes[mode];
		post("\n", "Setting Push 2 to mode:", mode_number, "(" + mode + ")");
	}
	else {
		error("\n", "Invalid mode. Setting Push 2 to Live mode.")
		mode = 0;
	}

	initialize_command = [240, 0, 33, 29, 1, 1, 10, mode_number, 247]
	for (var i = 0; i < initialize_command.length; i++) {
		outlet(midi_outlet, initialize_command[i]);
	}
}

function get_pad_colordict() {
	for (key in pad_colors) {
		post("\n", key, pad_colors[key])
	}
}

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
		post("\n", midi_msg)
	}
}

function parse_sysex(sysex_command) {
	sysex_id = sysex_command[0]
	sysex_args = sysex_command[1]
	switch(true) {
		case sysex_id == 10:
			push_mode = sysex_args;
			post("\n", "[HARDWARE RESPONSE] Push 2 set to mode:", push_mode)
			break;
	}
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
	outlet(info_outlet, "xy", xy[0], xy[1], value);
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
	if (nn in pad_last_color) {
		lastcolor = pad_last_color[nn]
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
	if (get_pad_lastcolor(nn) != value) {
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

function clear_row(y) {
	set_row(y, "off");
}

function set_column(x, value) {
	for (var i = 0; i < grid_height; i++) {
		set_pad(x, i, value);
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

// BUTTON FUNCTIONS

function get_button_name(cc) {
	for (key in button_list) {
		if (button_list[key][0] == cc) {
			name = key
			return name
		}
	}
	error("\n", "get_button_name: button not found")
}


function get_button_cc(name) {

	is_name_symbol = isNaN(name)

	if (is_name_symbol == 1) {
		if (name in button_list) {
			return button_list[name][0]
		}
		else {
			error("\n", "get_button_cc: invalid button name")
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
		error("\n", "get_button_type: invalid button name")
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
		error("\n", "set_button_color: invalid button name")
	}
}

function set_button(name, value) {
	is_value_symbol = isNaN(value);
	is_name_symbol = isNaN(name)

	if (is_name_symbol == 1) {
		name = get_button_cc(name)
	}

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
		cc_out(name, get_button_color(name, value), 1);
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
	for (var key in button_list) {
		post("\n", key);
	}
}

// TOUCHSTRIP
function set_touchstrip_mode(mode) {
	tstrip_address = [240, 0, 33, 29, 1, 1, 23];

	mode_list = {
		"pitch-bend" : 104,
		"mod-wheel" : 4,
		"default" : 5,
		"centered" : 21
	}

	for (var i = 0; i < tstrip_address.length; i++) {
		outlet(midi_outlet, tstrip_address[i]);
	}
	outlet(midi_outlet, mode_list[mode]);
	outlet(midi_outlet, 247);
}

function set_touchstrip(value) {
	cc_out(1, value, 1);
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

// MIDI FUNCTIONS

function note_out(note, vel, ch) {
	if (ch < 1) {
		ch = 1;
	};
	if ((require_user_mode == 1 && push_mode != 0) || require_user_mode == 0) {
		outlet(midi_outlet, 143 + ch);
		outlet(midi_outlet, note);
		outlet(midi_outlet, vel);
	}
	else if (require_user_mode == 1 && push_mode == 0) {
		error("\n", "Push 2 set to Live mode. Please initialize.")
	}
	
}

function cc_out(cc, vel, ch) {
	if (ch < 1) {
		ch = 1;
	};
	if ((require_user_mode == 1 && push_mode != 0) || require_user_mode == 0) {
		outlet(midi_outlet, 175 + ch);
		outlet(midi_outlet, cc);
		outlet(midi_outlet, vel);
	}
	else if (require_user_mode == 1 && push_mode == 0) {
		error("\n", "Push 2 set to Live mode. Please initialize.")
	}
	
}
