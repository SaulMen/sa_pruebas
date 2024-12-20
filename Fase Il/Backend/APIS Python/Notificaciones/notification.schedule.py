from apscheduler.schedulers.blocking import BlockingScheduler
from notificaciones import notificacion_carrito_abandonado, notificacion_stock_bajo

scheduler = BlockingScheduler()

scheduler.add_job(notificacion_carrito_abandonado, 'cron', hour=8, minute=0)  
scheduler.add_job(notificacion_stock_bajo, 'cron', hour=9, minute=0)      

print("Iniciando el programador de tareas...")
scheduler.start()
