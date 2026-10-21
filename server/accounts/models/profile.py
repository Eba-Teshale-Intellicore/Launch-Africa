
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import models

from common.models import BaseModel


https_url_validator = URLValidator(schemes=["https"])


class Profile(BaseModel):
    # Every user has one profile.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # Public identity.
    display_name = models.CharField(
        max_length=100,
        blank=True,
    )

    bio = models.CharField(
        max_length=500,
        blank=True,
    )

    # Cloudinary asset information.
    avatar_public_id = models.CharField(
        max_length=255,
        blank=True,
    )

    avatar_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    # Location.
    country = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )


    # Personal website and selected social profiles.
    website_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    github_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    linkedin_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    x_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )

    youtube_url = models.URLField(
        max_length=500,
        blank=True,
        validators=[https_url_validator],
    )
    
    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        super().clean()

        text_fields = (
            "display_name",
            "bio",
            "country",
            "city",
        )

        for field_name in text_fields:
            value = getattr(self, field_name, "")
            setattr(self, field_name, value.strip())

        # Validate HTTPS URLs even when model validation
        # is explicitly called outside a form.
        url_fields = (
            "avatar_url",
            "website_url",
            "github_url",
            "linkedin_url",
            "x_url",
            "youtube_url",
        )

        for field_name in url_fields:
            value = getattr(self, field_name, "")

            if value:
                try:
                    https_url_validator(value)
                except ValidationError as exc:
                    raise ValidationError(
                        {field_name: "Enter a valid HTTPS URL."}
                    ) from exc

    def __str__(self):
        return self.display_name or self.user.username
