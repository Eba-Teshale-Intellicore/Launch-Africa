
from django.contrib import admin
from accounts.models.user import User
from accounts.models.profile import Profile
# Register your models here.
admin.site.register(User)
admin.site.register(Profile)