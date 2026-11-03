
from django.contrib import admin

from accounts.models.profile import Profile
from accounts.models.user import User

# Register your models here.
admin.site.register(User)
admin.site.register(Profile)