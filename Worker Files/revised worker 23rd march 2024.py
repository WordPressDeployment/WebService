import socketio
import random
import time
import tkinter as tk
import threading
import uuid
from threading import Lock

# Constants
SERVER_URL = 'https://webservice-0-2.onrender.com'
NAMESPACE = '/ccdev'

# Global variables
running = False
running_lock = Lock()

sio = socketio.Client()


@sio.event(namespace=NAMESPACE)
def connect():
    print('Connected to server')


@sio.event(namespace=NAMESPACE)
def disconnect():
    print('Disconnected from server')


@sio.event(namespace=NAMESPACE)
def connection_success(data):
    print('Connection successful:', data)


@sio.event(namespace=NAMESPACE)
def data_inserted(data):
    print('New item inserted:', data)


def generate_random_data():
    sysUUID = str(uuid.uuid4())
    lastrowid = random.randint(1, 100)
    sid = random.randint(1, 100)
    score = random.uniform(0, 10)
    timestamp = int(time.time())
    duration = random.randint(1, 100)
    ts = random.randint(1, 100)

    json_data = {
        "sysUUID": sysUUID,
        "lastrowid": lastrowid,
        "sid": sid,
        "score": score,
        "timestamp": timestamp,
        "duration": duration,
        "ts": ts
    }

    sio.emit('data_received', json_data, namespace='/ccdev')
    print(f"Sent data to server: {json_data}")


def start_sending_data():
    global running
    with running_lock:
        running = True
    while running:
        generate_random_data()
        time.sleep(3)


def stop_sending_data():
    global running
    with running_lock:
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
root.geometry("250x100")  # Set the window size

start_button = tk.Button(root, text="Start Sending Data", command=start_button_clicked)
start_button.pack()

stop_button = tk.Button(root, text="Stop Sending Data", command=stop_sending_data)
stop_button.pack()

try:
    sio.connect(SERVER_URL, namespaces=[NAMESPACE], transports=['websocket'])
except socketio.exceptions.ConnectionError as e:
    print(f"Failed to connect: {str(e)}")

root.mainloop()
