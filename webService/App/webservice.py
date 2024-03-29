from flask import request
from flask_socketio import SocketIO, Namespace, emit

def setup_sc(app):
    sio = SocketIO(app, cors_allowed_origins='*', async_mode='gevent')
    class webJect(Namespace):
        def on_connect(self):
            if request.namespace != '/ccdev':
                print(f"Client {request.sid} tried to connect to an invalid namespace: {request.namespace}")
                return False  # Reject connection
            print(f"Client {request.sid} connected to namespace {request.namespace}")
            emit('connection_success', {'message': 'Connection successful'}, namespace='/ccdev')
            return True  # Accept connection

        def on_disconnect(self):
            print(f"Client {request.sid} disconnected")

        def on_data_received(self, data):
            print(f"Client ID: {request.sid}, Data received: {data}") #will pass formatted data to an algo to check soon
            formatted_data = {
                'sysUUID': data['sysUUID'],
                'lastrowid': data['lastrowid'],
                'sid': data['sid'],
                'score': data['score'],
                'timestamp': data['timestamp'],
                'duration': data['duration'],
                'ts': data['ts']
            }
            sio.start_background_task(target=self.emit_data_inserted, data=formatted_data)

        def emit_data_inserted(self, data):
            sio.emit('data_inserted', data, namespace='/ccdev')

    # Instantiate the namespace class
    namespace_instance = webJect('/ccdev')
    # Register the namespace instance
    sio.on_namespace(namespace_instance)

    print("Running web service...")
    return sio
