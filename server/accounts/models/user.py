
from django.contrib.auth.models import AbstractUser
from django.db import models

from accounts.models.managers import UserManager
from common.models import BaseModel


class User(BaseModel, AbstractUser):
    """
    Authentication and account permissions for LaunchAfrica.
    UUID and timestamps are inherited from BaseModel.
    """

    class Role(models.TextChoices):
        BUILDER = "builder", "Builder"
        MODERATOR = "moderator", "Moderator"
        ADMIN = "admin", "Admin"

    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"

    # Public account identifier.
    username = models.CharField(
        max_length=30,
        unique=True,
    )

    # Email is the account's login identifier.
    email = models.EmailField(
        unique=True,
    )

    auth_provider = models.CharField(
        max_length=10,
        choices=AuthProvider.choices,
        default=AuthProvider.EMAIL,
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.BUILDER,
    )

    is_verified = models.BooleanField(default=True)

 
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    class Meta:
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["is_active"]),
        ]


    def save(self, *args, **kwargs):
        # Keep email formatting consistent across accounts.
        if self.email:
            self.email = self.email.strip().lower()

        if self.username:
            self.username = self.username.strip().lower()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
