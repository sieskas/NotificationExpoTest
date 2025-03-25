package com.storetraffic

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.os.Build

object NotificationChannelCreator {
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = context.resources.getString(R.string.default_notification_channel_id)
            val channelName = context.resources.getString(R.string.default_notification_channel_name)

            val notificationManager = context.getSystemService(NotificationManager::class.java)

            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Canal pour les notifications de l'application"
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(channel)
        }
    }
}
