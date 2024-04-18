# blue prints are imported 
# explicitly instead of using *
from .user import user_views
from .auth import auth_views
from .login import login_views
from .index import index_views
from .client import client_views
from .mapper import mapper_views


views = [user_views, auth_views, index_views, login_views, client_views, mapper_views] 
# blueprints must be added to this list