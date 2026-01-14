import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HistorialCorreo } from '../../../../types/correo.types';

@Component({
    selector: 'app-detalle-correo',
    templateUrl: './detalle-correo.component.html',
    styleUrls: ['./detalle-correo.component.scss']
})
export class DetalleCorreoComponent {
    correo: HistorialCorreo;

    constructor(
        public dialogRef: MatDialogRef<DetalleCorreoComponent>,
        @Inject(MAT_DIALOG_DATA) public data: HistorialCorreo
    ) {
        this.correo = data;
    }

    formatearFecha(fecha: Date): string {
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    copiarTexto(texto: string): void {
        navigator.clipboard.writeText(texto)
            .then(() => {
                // Podrías mostrar un toast de éxito
                console.log('Texto copiado al portapapeles');
            })
            .catch(err => {
                console.error('Error al copiar texto:', err);
            });
    }
}