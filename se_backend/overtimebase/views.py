from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import OvertimeBase
from .serializers import OvertimeBaseSerializer

class OvertimeBaseViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = OvertimeBase.objects.all()
    serializer_class = OvertimeBaseSerializer