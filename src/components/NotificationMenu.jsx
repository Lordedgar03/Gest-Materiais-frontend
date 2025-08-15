function NotificationMenu({ notifications = [] }) {
    return (
      <div
        className="absolute right-10 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50"
        role="menu"
      >
        <ul className="text-sm text-gray-700 max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <li className="px-4 py-3 text-center text-gray-400">
              Sem notificações
            </li>
          ) : (
            notifications.map((notif, index) => (
              <li
                key={index}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
              >
                <p className="font-semibold text-gray-800">{notif.titulo}</p>
                <p className="text-gray-600 text-sm">{notif.mensagem}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(notif.data)}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }
  
  // Função auxiliar para formatar data/hora
  function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  
  export default NotificationMenu;
  