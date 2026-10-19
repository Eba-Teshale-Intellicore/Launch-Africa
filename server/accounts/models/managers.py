from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email or not email.strip():
            raise ValueError("An email address is required.")

        email = email.strip().lower()
        username = extra_fields.get("username", "")

        if not username or not username.strip():
            raise ValueError("A username is required.")

        extra_fields["username"] = username.strip().lower()

        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email,
        username,
        password=None,
        **extra_fields,
    ):
        if not password:
            raise ValueError("A superuser must have a password.")

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", self.model.Role.ADMIN)

        if extra_fields["is_staff"] is not True:
            raise ValueError("A superuser must have is_staff=True.")

        if extra_fields["is_superuser"] is not True:
            raise ValueError(
                "A superuser must have is_superuser=True."
            )

        return self.create_user(
            email=email,
            username=username,
            password=password,
            **extra_fields,
        )