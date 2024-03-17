import socketio
import random
import time
import tkinter as tk
import threading
import uuid

# Define the server URL
server_url = 'https://8080-chrisgwx-webservice02-xtt6b5emj5o.ws-us110.gitpod.io'

sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')

@sio.event
def disconnect():
    print('Disconnected from server')

@sio.event
def connection_success(data):
    print('Connection successful:', data)

@sio.event
def data_inserted(data):
    print('New item inserted:', data)

# Data model for the client
def generate_random_data():
    sysUUID = str(uuid.uuid4())
    sid = random.randint(1, 100)
    score = random.uniform(0, 10)
    timestamp = int(time.time())
    duration = random.randint(1, 100)
    ts = random.randint(1, 100)

    json_data = {
        "sysUUID": sysUUID,
        "sid": sid,
        "score": score,
        "timestamp": timestamp,
        "duration": duration,
        "ts": ts
    }

    sio.emit('trigger_refresh', json_data)
    print(f"Sent data to server: {json_data}")

def start_sending_data():
    global running
    running = True
    while running:
        generate_random_data()
        time.sleep(3)

def stop_sending_data():
    global running
    running = False
    enable_start_button()

def disable_start_button():
    start_button.config(state=tk.DISABLED)

def enable_start_button():
    start_button.config(state=tk.NORMAL)

def start_button_clicked():
    disable_start_button()
    threading.Thread(target=start_sending_data).start()

root = tk.Tk()
root.title("Tester App")
root.geometry("250x75")  # Set the window size

start_button = tk.Button(root, text="Start Sending Data", command=start_button_clicked)
start_button.pack()

stop_button = tk.Button(root, text="Stop Sending Data", command=stop_sending_data)
stop_button.pack()

sio.connect(server_url)

root.mainloop()
