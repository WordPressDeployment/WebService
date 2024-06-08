<?php

/**
 * Plugin name: mCylia Plugin
 * Description: Plugin for transferring Data and viewing real-time data
 * Version: 1.0.0
 * Text Domain: data_plugin
 * Author: CC dev
 */



//=============================== Webservice Login ============================================

// Shortcode to display login form or user information
class Portal
{
    function __construct()
    {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_custom_scripts'));
        add_shortcode('ws_login', array($this, 'ws_login_shortcode'));
        add_action('init', array($this, 'custom_login_form_submission'));
        add_action('wp_jwt_token', array($this, 'get_jwt_token'));
        add_action('init_logout', array($this, 'custom_ws_logout'));
        add_shortcode('custom_login_form', 'custom_login_form_shortcode');
    }

    function enqueue_custom_scripts()
    {

        wp_enqueue_style('bootstrap-css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        wp_enqueue_script('jquery');
        wp_enqueue_script('datatables-js', 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js', array('jquery'), null, true);
        wp_enqueue_script('custom-js', plugins_url('/includes/custom.js', __FILE__), array('jquery'), '1.0.0', true);
    }

    function ws_login_shortcode()
    {
        ob_start(); // Start output buffering
?>



        <div class="login-container">
            <?php
            $token = $this->get_jwt_token(); // Retrieve JWT token from method //may not need this
            if ($token) {
                // Make authenticated request to Flask API to get user information
                $response = wp_remote_get('placeholder', array(
                    'headers' => array(
                        'auth_head' => $token,
                        'auth_value' => 'Bearer',
                    ),
                ));

                if (!is_wp_error($response) && $response['response']['code'] === 200) {
                    $body = wp_remote_retrieve_body($response);
            ?>
                    <iframe src=<?php echo $body ?> title="Webservice" width="100%" height="100%"></iframe>


                <?php } else {
                ?><h2>Portal to CCDEV Webservice</h2>
                    <form id="custom-login-form" action="#" method="POST">
                        <div class="input-group">
                            <label for="username">Username:</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        <div class="input-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit">Login</button>
                    </form>
                <?php
                }
            } else {
                // Display login form
                ?>
                <h2>Portal to CCDEV Webservice</h2>
                <form id="custom-login-form" action="#" method="POST">
                    <div class="input-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Login</button>
                </form>
            <?php } ?>
        </div>



        <?php
        $output = ob_get_clean(); // Get the output buffer and clean it
        return $output; // Return the generated HTML
    }


    function custom_ws_logout() //remove this later
    {
        if (isset($_POST['logout'])) {
            // Clear token cookie to logout the user from WordPress
            setcookie('access_token', '', time() - 3600, '/', '', false, true);
            // Redirect to portal
            echo '<script>window.location.href="' . home_url('/WebservicePortal') . '";</script>';
            exit;
        }
    }




    function custom_login_form_submission()
    {
        if (isset($_POST['username']) && isset($_POST['password'])) {
            $data = array(
                'username' => sanitize_text_field($_POST['username']),
                'password' => sanitize_text_field($_POST['password'])
            );

            $response = wp_remote_post('https://webservice-0-2.onrender.com/api/login', array(
                'body' => json_encode($data),
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
            ));

            if (!is_wp_error($response) && $response['response']['code'] === 200) {
                $body = wp_remote_retrieve_body($response);
                $data = json_decode($body, true);
                $token = $data['access_token'];

                // Store token in cookie or session
                setcookie('access_token', $token, time() + 3600, '/', '', false, true); // Example: Cookie valid for 1 hour

                // Redirect user to portal
                wp_redirect(home_url('/WebservicePortal'));
                exit;
            } else {
                echo 'Login failed. Please try again.';
            }
        }
    }

    function get_jwt_token()
    {
        if (isset($_COOKIE['access_token'])) {
            return $_COOKIE['access_token'];
        } else {
            return false;
        }
    }

    function custom_login_form_shortcode()
    {
        // Check if the user is logged in
        if (is_user_logged_in()) {
            // If logged in, display a message and a logout link
            $current_user = wp_get_current_user();
            $logout_url = wp_logout_url(home_url());
            $message = 'You are already signed in as ' . esc_html($current_user->user_login) . '. <a href="' . esc_url($logout_url) . '">Logout</a>';
            return $message;
        } else {
            // If not logged in, display the custom login form
            ob_start();
        ?>
            <form name="loginform" id="loginform" action="<?php echo esc_url(wp_login_url()); ?>" method="post">
                <input type="hidden" name="redirect_to" value="<?php echo esc_url($_SERVER['REQUEST_URI']); ?>">
                <p>
                    <label for="user_login">Username<br />
                        <input type="text" name="log" id="user_login" class="input" value="" size="20" /></label>
                </p>
                <p>
                    <label for="user_pass">Password<br />
                        <input type="password" name="pwd" id="user_pass" class="input" value="" size="20" /></label>
                </p>
                <p class="submit">
                    <input type="submit" name="wp-submit" id="wp-submit" class="button button-primary" value="Log In" />
                </p>
            </form>
<?php
            $form = ob_get_clean();

            return $form;
        }
    }
}
// class Stream
// {
//     public function __construct()
//     {
//         add_shortcode('socketio_table', array($this, 'socketio_table_shortcode'));
//         add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
//     }

//     function enqueue_scripts()
//     {
//         wp_enqueue_script('jquery');
//         wp_enqueue_script('socketio-client', 'https://cdn.socket.io/4.4.1/socket.io.min.js', array(), null, true);
//     }

//     function socketio_table_shortcode($atts)
//     {

//         $access_token = $this->get_jwt_token();

//         ob_start(); // Start output buffering

//         
?>
// <table id="socketioTable">
    // <thead>
        // <tr>
            // <th>sysUUID</th>
            // <th>lastrowid</th>
            // <th>sid</th>
            // <th>score</th>
            // <th>timestamp</th>
            // <th>duration</th>
            // <th>ts</th>
            // </tr>
        // </thead>
    // <tbody></tbody>
    // </table>
// <script>
    //             jQuery(document).ready(function($) {

    //                 var socket = io.connect('https://webservice-0-2.onrender.com/ccdev', {
    //                     transports: ['websocket'],
    //                     query: {
    //                         token: '<?php echo $access_token; ?>'
    //                     }
    //                 });

    //                 socket.on('data_inserted', function(data) {
    //                     console.log('Data received from the server:', data);
    //                     displayDataInTable(data);
    //                 });

    //                 function displayDataInTable(data) {
    //                     $('#socketioTable tbody').append(`<tr><td>${data.sysUUID}</td><td>${data.lastrowid}</td><td>${data.sid}</td><td>${data.score}</td><td>${data.timestamp}</td><td>${data.duration}</td><td>${data.ts}</td></tr>`);
    //                 }

    //                 socket.on('connect', function() {
    //                     socket.emit('join');

    //                     console.log('Connected to the Socket.IO server');
    //                 });

    //                 socket.on('disconnect', function() {
    //                     console.log('Disconnected from the Socket.IO server');
    //                 });
    //             });
    //         
</script>
// <?php

    //         return ob_get_clean(); // Return the buffered content
    //     }
    //     function get_jwt_token() # Get JWT token from cookie eventually change to one instance of this
    //     {
    //         if (isset($_COOKIE['access_token'])) {
    //             return $_COOKIE['access_token'];
    //         } else {
    //             return false;
    //         }
    //     }
    // }
    // $streamEvent = new Stream();
    $portal = new Portal();

//=============================== Webservice Login ============================================