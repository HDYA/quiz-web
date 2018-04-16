var config = {
    text: {
        new_user: {
            description: "Please choose a username",
            button: "Confirm",
            notification: "Welcome to .net quiz game, powered by ASP.NET",
        },
        existing_user: {
            button: "Start",
            notification: "Welcome back to .net quiz game, powered by ASP.NET",
        },
        play_again: {
            button: "Play Again"
        }
    },
    status: {
        connectivity_field_name: "databaseConnected",
        block_login_without_database: true,
    },
    animation: {
        fadeIn: 300,
        fadeOut: 300,
    },
    display: {
        user_panel: {
            font_size_default: 20,
            font_size_small: 12,
            width: 280,
        },
        button: {
            width: 150,
            height: 30,
            padding: 5,
            font_size: 20,
        }
    },
    retry: {
        limit: 3,
        timeout: 1500,
    },
    endpoint: {
        user: '/api/users/',
        problem: '/api/problems/0',
        status: '/api/status',
    },
    quiz: {
        problem_count: 3,
        count_down : 10,
        score_base: 50,
        score_time_bonus: 10,
    }
};