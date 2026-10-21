# accounts/services/auth.py
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from accounts.models.profile import Profile
from accounts.models.user import User


EDITABLE_PROFILE_FIELDS = {
    "display_name",
    "bio",
    "country",
    "city",
    "website_url",
    "github_url",
    "linkedin_url",
    "x_url",
    "youtube_url",
}

# create_user_with_profile
def register_user(username, email, password):
    username = username.strip().lower()
    email = email.strip().lower()

    candidate = User(username=username, email=email)
    validate_password(password, user=candidate)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            profile = Profile.objects.create(user=user)

    except IntegrityError as exc:
        raise ValidationError({
            "detail": (
                "An account with this email or username "
                "may already exist."
            )
        }) from exc

    return user, profile

# change_user_password
@transaction.atomic
def change_password(user, current_password, new_password):
    if not user.check_password(current_password):
        raise ValidationError({
            "current_password": "Current password is incorrect."
        })

    validate_password(new_password, user=user)

    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])

    return user


@transaction.atomic
def update_user_profile(user, profile_data):
    profile, _created = Profile.objects.get_or_create(user=user)

    for field, value in profile_data.items():
        if field not in EDITABLE_PROFILE_FIELDS:
            raise ValidationError({
                field: "This profile field cannot be edited."
            })

        setattr(profile, field, value)

    profile.full_clean()
    profile.save()

    return profile

# reset_user_password
@transaction.atomic
def reset_password(user, new_password):
    validate_password(new_password, user=user)

    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])

    return user